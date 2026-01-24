# require_dependency 'jwt_blacklist' if Rails.env.development?

class User < ApplicationRecord
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

  # after_initialize :set_default_role, if: :new_record?

  validate :password_complexity

  private 

  def password_complexity
    return if password.blank?
    
    if password.length < 8
      errors.add(:password, 'must be at least 8 characters')
    end
    
    unless password =~ /[A-Z]/
      errors.add(:password, 'must contain at least one uppercase letter')
    end
    
    unless password =~ /\d/
      errors.add(:password, 'must contain at least one number')
    end
    
    unless password =~ /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
      errors.add(:password, 'must contain at least one special character')
    end
  end
end
