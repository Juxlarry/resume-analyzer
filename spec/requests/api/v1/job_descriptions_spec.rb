require 'swagger_helper'

RSpec.describe 'api/v1/job_descriptions', type: :request do
  # This tells Rswag to use the Bearer token for all paths in this file
  

  path '/api/v1/job_descriptions' do

    get 'List all job descriptions' do
      tags 'Job Descriptions'
      produces 'application/json'

      response '200', 'job descriptions found' do
        schema type: :array, items: { '$ref' => '#/components/schemas/job_description' }
        run_test!
      end
    end

    post 'Create a job description' do
      tags 'Job Descriptions'
      consumes 'application/json'
      parameter name: :job_description, in: :body, schema: {
        type: :object,
        properties: {
          job_description: {
            type: :object,
            properties: {
              title: { type: :string },
              description: { type: :string }
            },
            required: %w[title description]
          }
        }
      }

      response '201', 'job description created' do
        run_test!
      end

      response '422', 'invalid request' do
        run_test!
      end
    end
  end

  path '/api/v1/job_descriptions/{id}/analyze' do
    parameter name: :id, in: :path, type: :string, description: 'id'

    post 'Analyze Resume' do
      tags 'Analysis'
      description 'Uploads a new resume or uses the existing one to start AI analysis'
      consumes 'multipart/form-data'
      
      parameter name: :resume, in: :formData, type: :file, required: false, 
                description: 'Optional: Upload a new resume file (PDF/Docx)'

      response '202', 'analysis started' do
        schema type: :object,
               properties: {
                 message: { type: :string },
                 job_id: { type: :integer },
                 status_url: { type: :string },
                 new_resume_uploaded: { type: :boolean }
               }
        run_test!
      end

      response '422', 'resume missing or attachment failed' do
        run_test!
      end
    end
  end

  path '/api/v1/job_descriptions/{id}/analysis_status' do
    parameter name: :id, in: :path, type: :string

    get 'Get Analysis Status and Results' do
      tags 'Analysis'
      produces 'application/json'

      response '200', 'status retrieved' do
        schema type: :object,
               properties: {
                 status: { type: :string, example: 'completed' },
                 estimated_wait_time: { type: :string, nullable: true },
                 analysis: {
                   type: :object,
                   nullable: true,
                   properties: {
                     match_score: { type: :integer },
                     verdict: { type: :string },
                     summary: { type: :string },
                     strengths: { type: :string },
                     weaknesses: { type: :string },
                     recommendations: { type: :string },
                     missing_keywords: { type: :string },
                     completed_at: { type: :string, format: 'date-time' }
                   }
                 }
               }
        run_test!
      end

      response '404', 'analysis not found' do
        run_test!
      end
    end
  end
end