require 'swagger_helper'

RSpec.describe 'api/v1/job_descriptions', type: :request do
  # Link to the securityScheme defined in swagger_helper.rb
  

  path '/api/v1/job_descriptions/{id}/analyze' do

    parameter name: :id, in: :path, type: :integer, description: 'ID of the Job Description'

    post 'Triggers or re-runs resume analysis' do
      tags 'Analysis'
      description 'Uploads a new resume via multipart/form-data or triggers analysis on the existing attachment.'
      consumes 'multipart/form-data'
      
      parameter name: :resume, in: :formData, schema: {
        type: :object,
        properties: {
          resume: { 
            type: :string, 
            format: :binary, 
            description: 'The PDF/Docx resume file to upload (Optional if already attached)' 
          }
        }
      }

      response '202', 'Analysis started successfully' do
        schema type: :object,
               properties: {
                 message: { type: :string, example: 'Analysis started in background.' },
                 job_id: { type: :integer, example: 1 },
                 status_url: { type: :string, example: 'http://localhost:3000/api/v1/job_descriptions/1/analysis_status' },
                 new_resume_uploaded: { type: :boolean, example: true }
               }
        run_test!
      end

      response '200', 'Analysis already in progress' do
        schema type: :object,
               properties: {
                 message: { type: :string, example: 'Analysis already in progress' },
                 status_url: { type: :string }
               }
        run_test!
      end

      response '422', 'Unprocessable Entity (e.g., attachment failed or resume missing)' do
        schema type: :object,
               properties: {
                 error: { type: :string, example: 'No resume attached to this job description.' }
               }
        run_test!
      end

      response '404', 'Job Description not found' do
        schema '$ref' => '#/components/schemas/error_not_found'
        run_test!
      end
    end
  end

  path '/api/v1/job_descriptions/{id}/analysis_status' do
    parameter name: :id, in: :path, type: :integer, description: 'ID of the Job Description'

    get 'Retrieve status and AI results' do
      tags 'Analysis'
      description 'Returns the current status (pending, processing, completed, failed) and the AI feedback if finished.'
      produces 'application/json'

      response '200', 'Status retrieved' do
        schema type: :object,
               properties: {
                 status: { type: :string, example: 'completed' },
                 estimated_wait_time: { type: :string, nullable: true, example: 'Approximately 2-3 minutes' },
                 analysis: {
                   type: :object,
                   nullable: true,
                   properties: {
                     match_score: { type: :integer, example: 85 },
                     verdict: { type: :string, example: 'Strong Match' },
                     summary: { type: :text },
                     strengths: { type: :text },
                     weaknesses: { type: :text },
                     recommendations: { type: :text },
                     missing_keywords: { type: :text, example: 'Docker, Kubernetes' },
                     completed_at: { type: :string, format: 'date-time' }
                   }
                 },
                 error: { type: :string, nullable: true, description: 'Present if status is failed' }
               }
        run_test!
      end

      response '404', 'Analysis record not found' do
        schema type: :object,
               properties: {
                 status: { type: :string, example: 'not_started' },
                 message: { type: :string }
               }
        run_test!
      end
    end
  end
end