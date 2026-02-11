class Api::V1::JobDescriptionsController < ApplicationController
  include Rails.application.routes.url_helpers
  before_action :authenticate_user!
  before_action :set_job_description, only: %i[ show analyze analysis_status destroy ]
  

  # GET /api/v1/job_descriptions
  def index
    @job_descriptions = current_user.job_descriptions.includes(:resume_analysis).order(created_at: :desc)

    render json: @job_descriptions, include: :resume_analysis
  end

  # GET /api/v1/job_descriptions/:id
  def show

    render json: {
      id: @job_description.id,
      title: @job_description.title,
      description: @job_description.description,
      has_resume: @job_description.resume.attached?,
      created_at: @job_description.created_at,
      resume_file: resume_file_data(@job_description),
      resume_analysis: @job_description.resume_analysis&.as_json(
        only: [:id, :match_score, :verdict, :summary, :strengths, :weaknesses,:recommendations, :missing_keywords, :status, :ai_model_used, :created_at, :updated_at]
      )
    }

  end

  # POST /api/v1/job_descriptions
  def create
    @job_description = current_user.job_descriptions.new(job_description_params)

    if @job_description.save
      #Creates initial resume analysis record with pending status
      @job_description.create_resume_analysis!(status: 'pending')

      render json: {
        id: @job_description.id,
        title: @job_description.title,
        message: "Job deescription created successfully."
      }, status: :created
    else
      render json: {
        errors: @job_description.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  #POST /api/v1/job_descriptions/:id/analyze
  def analyze 
    # Check if a new resume is being uploaded
    if params[:resume].present?
      # Attach new resume
      @job_description.resume.attach(params[:resume])

      unless @job_description.resume.attached?
        return render json: { 
          error: "Failed to attach new resume" 
        }, status: :unprocessable_entity
      end
    else
      # Validate existing resume is attached
      unless @job_description.resume.attached?
        return render json: { 
          error: "No resume attached to this job description. Please upload a resume." 
        }, status: :unprocessable_entity
      end
    end

    # Check if analysis already exists
    analysis = @job_description.resume_analysis
     
    if analysis.nil?
      analysis = @job_description.create_resume_analysis!(status: :pending)
    end

    # Allow re-run even if completed (user might have uploaded new resume)
    if analysis.processing?
      return render json: { 
        message: "Analysis already in progress",
        status_url: analysis_status_api_v1_job_description_url(@job_description)
      }, status: :ok
    end

    if analysis.processing?
      return render json: { 
        message: "Analysis already in progress",
        status_url: analysis_status_api_v1_job_description_url(@job_description)
      }, status: :ok
    end

    # Update status and queue job
    analysis.update!(status: :processing)
    ResumeAnalysisJob.perform_later(@job_description.id)

    render json: { 
      message: "Analysis started in background.",
      job_id: @job_description.id, 
      status_url: analysis_status_api_v1_job_description_url(@job_description),  new_resume_uploaded: params[:resume].present?
    }, status: :accepted
  rescue => e
    Rails.logger.error "Analyze action error: #{e.message}"
    render json: { error: "Failed to start analysis: #{e.message}" }, status: :internal_server_error
  end 
  

  # GET /api/v1/job_descriptions/:id/analysis_status
  def analysis_status
    analysis = @job_description.resume_analysis

    if analysis.nil?
      return render json: { 
        status: "not_started",
        message: "No analysis found for this job description." }, status: :not_found
    end

    response_data = {
      status: analysis.status,
      estimated_wait_time: analysis.processing? ? "Approximately 2-3 minutes" : nil
    }

    if analysis.completed?
      response_data[:analysis] = {
        match_score: analysis.match_score,
        verdict: analysis.verdict,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        missing_keywords: analysis.missing_keywords,
        completed_at: analysis.updated_at
      }
    elsif analysis.failed?
      response_data[:error] = analysis.error_messages || "Analysis failed"
    end

    render json: response_data
  end

  # DELETE /api/v1/job_descriptions/:id
  def destroy
    if @job_description.destroy
      render json: { message: "Job description deleted successfully." }, status: :ok
    else
      render json: { error: "Failed to delete job description." }, status: :unprocessable_entity
    end
  end


  private
    def set_job_description
      @job_description = current_user.job_descriptions.find(params.expect(:id))
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Job description not found" }, status: :not_found
    end

    def job_description_params
      params.require(:job_description).permit(:title, :description, :resume)
    end

    def resume_file_data(job_description)
      return nil unless job_description.resume.attached?

      {
        filename: job_description.resume.filename.to_s,
        size: job_description.resume.byte_size.to_i,
        content_type: job_description.resume.content_type,
        url: rails_blob_url(job_description.resume, host: request.base_url),
        download_url: rails_blob_url(job_description.resume, disposition: "attachment", host: request.base_url),
        created_at: job_description.resume.created_at
      }
    end
end
 
