class Api::V1::JobDescriptionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_job_description, only: %i[ show update destroy analyze analysis_status ]

  # GET /api/v1/job_descriptions
  def index
    @job_descriptions = current_user.job_descriptions.includes(:resume_analysis).order(created_at: :desc)

    render json: @job_descriptions, include: :resume_analysis
  end

  # GET /api/v1/job_descriptions/:id
  def show
    render json: @job_description, include: :resume_analysis
  end

  # POST /api/v1/job_descriptions
  def create
    @job_description = current_user.job_descriptions.new(job_description_params)

    if @job_description.save
      #Create initial resume analysis record with pending status
      @job_description.create_resume_analysis!(status: 'pending')

      render json: {
        id: @job_description.id,
        title: @job_description.title,
        message: "Job deescription created successfully."
      }, status: :created

      # render json: @job_description, status: :created, location: @job_description
    else
      render json: {
        errors: @job_description.errors.full_messages
      }, status: :unprocessable_entity

      # render json: @job_description.errors, status: :unprocessable_content
    end
  end

  #POST /api/v1/job_descriptions/:id/analyze
  def analyze 
    # Validate resume is attached
    unless @job_description.resume.attached?
      return render json: { 
        error: "No resume attached to this job description" 
      }, status: :unprocessable_entity
    end

    # Check if analysis already exists
    analysis = @job_description.resume_analysis
    
    if analysis.nil?
      analysis = @job_description.create_resume_analysis!(status: :pending)
    end

    # Check status
    if analysis.completed?
      return render json: { 
        message: "Analysis already completed",
        analysis: analysis
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


    #check if analysis already exists and is not pending
    # if @job_description.resume_analysis.completed? || @job_description.resume_analysis.processing?
    #   return render json: { error: "Analysis already completed or in progress for this job description." }, status: :ok 
    # end

    # @job_description.resume_analysis.update(status: 'processing')

    # ResumeAnalysisJob.perform_later(@job_description.id, current_user.id)

    render json: { 
      message: "Analysis started in background.",
      job_id: @job_description.id, 
      status_url: api_v1_job_description_analysis_status_url(@job_description)
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
        message: "No analysis found for this job description." }, status:not_found
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
      response_data[:error] = analysis.error_message || "Analysis failed"
    end

    render json: response_data


    # render json: {
    #   status: @job_description.resume_analysis.status,
    #   analysis: @job_descriptions.resume_analysis.completed? ? @job_description.resume_analysis : nil, 
    #   estimated_wait_time: @job_description.resume_analysis.processing? ? "Approximately 2 - 3 minutes" : nil
      # summary: @job_description.resume_analysis.summary,
      # strengths: @job_description.resume_analysis.strengths,
      # weaknesses: @job_description.resume_analysis.weaknesses,
      # recommendations: @job_description.resume_analysis.recommendations
    # }
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
end
 
