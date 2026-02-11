require 'swagger_helper'

RSpec.describe 'api/v1/users', type: :request do
  path '/api/v1/profile' do
    get 'Retrieve user profile' do
      tags 'User Profile'
      produces 'application/json'
      # Inherits global bearerAuth

      response '200', 'Profile found' do
        schema type: :object,
               properties: {
                 id: { type: :integer },
                 email: { type: :string },
                 role: { type: :string },
                 created_at: { type: :string, format: 'date-time' },
                 total_analyses: { type: :integer },
                 completed_analyses: { type: :integer },
                 two_factor_enabled: { type: :boolean }
               }
        run_test!
      end
    end

    put 'Update user profile' do
      tags 'User Profile'
      consumes 'application/json'
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string },
              password: { type: :string },
              password_confirmation: { type: :string }
            }
          }
        }
      }

      response '200', 'Profile updated' do
        run_test!
      end
    end
  end
end