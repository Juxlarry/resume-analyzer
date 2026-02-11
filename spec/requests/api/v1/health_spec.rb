require 'swagger_helper'

RSpec.describe 'Health API', type: :request do
  path '/api/v1/health' do
    get 'Health check' do
      tags 'Health'
      produces 'application/json'

      response '200', 'API is healthy' do
        schema type: :object,
          properties: {
            status: { type: :string }
          },
          required: ['status']

        run_test!
      end
    end
  end
end
