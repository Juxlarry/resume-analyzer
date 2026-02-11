require 'swagger_helper'

RSpec.describe 'api/v1/two_factor', type: :request do
  path '/api/v1/two_factor/setup' do
    get 'Start 2FA Setup' do
      tags 'Two-Factor Authentication'
      description 'Generates a new OTP secret and returns a QR code in SVG format.'
      
      response '200', 'Setup data generated' do
        schema type: :object,
               properties: {
                 secret: { type: :string },
                 qr_code: { type: :string, description: 'SVG string of the QR code' },
                 provisioning_uri: { type: :string }
               }
        run_test!
      end
    end
  end

  path '/api/v1/two_factor/enable' do
    post 'Enable 2FA' do
      tags 'Two-Factor Authentication'
      consumes 'application/json'
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: { code: { type: :string, description: '6-digit OTP from app' } },
        required: ['code']
      }

      response '200', '2FA Enabled' do
        schema type: :object,
               properties: {
                 message: { type: :string },
                 backup_codes: { type: :array, items: { type: :string } }
               }
        run_test!
      end
    end
  end

  path '/api/v1/two_factor/status' do
    get 'Check 2FA Status' do
      tags 'Two-Factor Authentication'
      response '200', 'Status retrieved' do
        schema type: :object,
               properties: {
                 enabled: { type: :boolean },
                 has_backup_codes: { type: :boolean }
               }
        run_test!
      end
    end
  end
end