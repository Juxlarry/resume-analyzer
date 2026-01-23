# require_dependency 'jwt_blacklist' if Rails.env.development?

class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
   devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtBlacklist

  has_many :job_descriptions, dependent: :destroy 
  has_many :resume_analyses, through: :job_descriptions

  # def self.jwt_revocation_strategy
  #   JWTBlacklist
  # end 
end
