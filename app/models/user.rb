require 'bcrypt'

class User < ApplicationRecord
  before_validation :set_default_role, on: :create

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
  :recoverable, :rememberable, :validatable,
  :jwt_authenticatable, jwt_revocation_strategy: JwtBlacklist

  has_many :job_descriptions, dependent: :destroy 
  has_many :resume_analyses, through: :job_descriptions


  enum :role, { 
    user: 0, 
    admin: 1, 
    moderator: 2 
  }, default: :user

  validate :password_complexity

  # Serialize backup codes
  serialize :otp_backup_codes, coder: JSON

  #Generate a new OTP Secret
  def generate_otp_secret
    self.otp_secret = ROTP::Base32.random 
  end 

  #Get the current OTP code (for testing/verification)
  def current_otp
    return nil unless otp_secret.present?

    totp = ROTP::TOTP.new(otp_secret, issuer: 'Resume Analyser')
    totp.now 
  end 

  #Verify an OTP code 
  def verify_otp_code(code)
    Rails.logger.info "in verify otp method"
    return false unless otp_secret.present?

    Rails.logger.info "continuing verify otp method"

    totp = ROTP::TOTP.new(otp_secret, issuer: 'Resume Analyser')

    Rails.logger.info "totp:: #{totp}"

    on_verify = totp.verify(code, drift_behind: 30, drift_ahead: 30)

    Rails.logger.info "on Verify #{on_verify}"
  end  

  #Generate backup codes
  def generate_otp_backup_codes
    codes = 10.times.map {SecureRandom.hex(4)}

    encrypted_codes = codes.map do |code| 
      BCrypt::Password.create(code).to_s
    end 

    self.otp_backup_codes = encrypted_codes
    codes
  end 

  #Verify backup code 
  def verify_backup_code(code)
    return false unless otp_backup_codes.present?
  
    Rails.logger.info "Verifying backup code: #{code}"

    Rails.logger.info "Total backup codes: #{otp_backup_codes.length}"

    self.with_lock do
      otp_backup_codes.each_with_index do |stored_hashed, index|

        Rails.logger.info "Stored_Hash -- #{stored_hashed}"
        Rails.logger.info "Index -- #{index}"

        begin 
          bcrypt_password = BCrypt::Password.new(stored_hashed)

          if bcrypt_password == code 

            Rails.logger.info "Backup code verified! Removing code at index #{index}"

            codes = otp_backup_codes.dup 
            codes.delete_at(index)
            update!(otp_backup_codes: codes)
            return true  
          end 
        rescue BCrypt::Errors::InvalidHash => e
          Rails.logger.error "Invalid BCrypt hash at index #{index}: #{e.message}"
          next
        end
      end 
    end
    
    Rails.logger.info "No matching backup code found"
    false
  end

  #Get provisioning URI for QR code 
  def otp_provisioning_uri
    return nil unless otp_secret.present?

    totp = ROTP::TOTP.new(otp_secret, issuer: 'Resume Analyser')
    totp.provisioning_uri(email)
  end 

  #Enable 2FA
  def enable_two_factor!
    update(otp_required_for_login: true)
  end 

  #Disable 2FA
  def disable_two_factor!
    update(
      otp_required_for_login: false,
      otp_secret: nil, 
      otp_backup_codes: nil
    )
  end 

  def total_job_descriptions
    job_descriptions.count
  end

  def completed_analyses_count
    job_descriptions.joins(:resume_analysis)
    .where(resume_analyses: { status: :completed })
    .count
  end

  private 

  def password_complexity
    return if password.blank?
    
    errors.add(:password, 'must be at least 8 characters') if password.length < 8
    errors.add(:password, 'must contain at least one uppercase letter') unless password =~ /[A-Z]/
    errors.add(:password, 'must contain at least one number') unless password =~ /\d/
    errors.add(:password, 'must contain at least one special character') unless password =~ /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  end

  def set_default_role
    self.role ||= "user"
  end
end
