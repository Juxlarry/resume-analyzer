require 'swagger_helper'

RSpec.describe 'api/v1/auth', type: :request do
  path '/api/v1/signup' do
    post 'User Registration' do
      tags 'Authentication'
      security []
      consumes 'application/json'
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string },
              password_confirmation: { type: :string },
              role: { type: :string, enum: ['user', 'admin'], default: 'user' }
            },
            required: %w[email password password_confirmation]
          }
        }
      }

      response '200', 'Signed up successfully' do
        header 'Authorization', schema: { type: :string }, description: 'Bearer JWT token'
        run_test!
      end

      response '422', 'Invalid request' do
        run_test!
      end
    end
  end

  path '/api/v1/login' do
    post 'User Login' do
      tags 'Authentication'
      security []
      consumes 'application/json'
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string }
            },
            required: %w[email password]
          }
        }
      }

      response '200', 'Logged in (or OTP required)' do
        description 'If 2FA is enabled, returns a requirement for OTP. Otherwise returns JWT in header.'
        header 'Authorization', schema: { type: :string }, description: 'Bearer JWT token'
        schema type: :object,
               properties: {
                 message: { type: :string },
                 otp_required: { type: :boolean },
                 user_id: { type: :integer }
               }
        run_test!
      end
    end
  end

  path '/api/v1/login/verify_otp' do
    post 'Verify 2FA Token' do
      tags 'Authentication'
      consumes 'application/json'
      parameter name: :otp_data, in: :body, schema: {
        type: :object,
        properties: {
          otp_user_id: { type: :integer },
          code: { type: :string, description: 'The 6-digit code from Google Authenticator' }
        },
        required: %w[otp_user_id code]
      }

      response '200', 'OTP Verified' do
        header 'Authorization', schema: { type: :string }, description: 'Bearer JWT token'
        run_test!
      end

      response '401', 'Invalid OTP' do
        run_test!
      end
    end
  end

  path '/api/v1/logout' do
    delete 'User Logout' do
      tags 'Authentication'
      security [bearerAuth: []]

      response '200', 'Logged out successfully' do
        run_test!
      end
    end
  end

  path '/api/v1/password' do
    post 'Request password reset' do
      tags 'Authentication'
      security []
      consumes 'application/json'
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: { user: { type: :object, properties: { email: { type: :string } } } }
      }
      response '200', 'Instructions sent' do
        run_test!
      end
    end
  end
end