# frozen_string_literal: true

require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'Resume Analyser API',
        version: 'v1',
        description: 'API for analyzing resumes against job descriptions'
      },
      security: [ { bearerAuth: [] } ],
      paths: {},
      servers: [
        {
          url: 'http://localhost:3000',  # Fallback
          description: 'Local development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: :http,
            scheme: :bearer,
            bearerFormat: 'JWT',
            description: 'JWT Authorization header using the Bearer scheme'
          }
        },
        schemas: {
          job_description: {
            type: :object,
            properties: {
              id: { type: :integer },
              title: { type: :string },
              description: { type: :string },
              created_at: { type: :string, format: 'date-time' },
              resume_analysis: {
                type: :object,
                nullable: true,
                properties: {
                  status: { type: :string },
                  match_score: { type: :integer }
                }
              }
            }
          }
        }
      }
    }
  }

  config.openapi_format = :yaml
end