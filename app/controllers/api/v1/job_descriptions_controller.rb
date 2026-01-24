class Api::V1::JobDescriptionsController < ApplicationController
  before_action :set_job_description, only: %i[ show update destroy analyze analysis_status ]

  # GET /job_descriptions
  def index
    @job_descriptions = current_user.job_descriptions.order(created_at: :desc)

    render json: @job_descriptions, include: :resume_analysis
  end

  # GET /job_descriptions/1
  def show
    render json: @job_description, include: :resume_analysis
  end

  # POST /job_descriptions
  def create
    @job_description = current_user.job_descriptions.new(job_description_params)

    if @job_description.save
      #Create initial resume analysis record with pending status
      @job_description.create_resume_analysis(status: 'pending')

      render json: @job_description, status: :created, location: @job_description
    else
      render json: @job_description.errors, status: :unprocessable_content
    end
  end

  def analyze 
    #Extract text from resume
    # resume_text = "Extracted resume text placeholder"
    #check if analysis already exists and is not pending
    if @job_description.resume_analysis.completed? || @job_description.resume_analysis.processing?
      return render json: { error: "Analysis already completed or in progress for this job description." }, status: :ok 
    end

    @job_description.resume_analysis.update(status: 'processing')

    ResumeAnalysisJob.perform_later(@job_description.id, current_user.id)

    render json: { 
      message: "Analysis started in background.",
      job_id: @job_description.id, 
      status_url: api_v1_job_description_analysis_status_url(@job_description)
    }, status: :accepted


    # Call LLMAnalyzerService - This is now handled by Sidekiq
  #   analyzer = LLMAnalyzerService.new
  #   analysis_result = analyzer.analyze(@job_description.description, resume_text)

  #   #save analysis 
  #   resume_analysis = @job_description.create_resume_analysis(
  #     # analysis: analysis_result
  #     summary: analysis_result["summary"],
  #     strengths: analysis_result["strengths"],
  #     weaknesses: analysis_result["weaknesses"],
  #     recommendations: analysis_result["recommendations"], 
  #     ai_model_used: "gpt-4-turbo-preview"
  #   )

  #   render json: resume_analysis

  # rescue => e 
  #   render json: { error: "Analysis failed: #{e.message}" }, status: :internal_server_error

  end 

  def analysis_status
    render json: {
      status: @job_description.resume_analysis.status,
      analysis: @job_descriptions.resume_analysis.completed? ? @job_description.resume_analysis : nil, 
      estimated_wait_time: @job_description.resume_analysis.processing? ? "Approximately 2 - 3 minutes" : nil
      # summary: @job_description.resume_analysis.summary,
      # strengths: @job_description.resume_analysis.strengths,
      # weaknesses: @job_description.resume_analysis.weaknesses,
      # recommendations: @job_description.resume_analysis.recommendations
    }
  end

  # PATCH/PUT /job_descriptions/1
  # def update
  #   if @job_description.update(job_description_params)
  #     render json: @job_description
  #   else
  #     render json: @job_description.errors, status: :unprocessable_content
  #   end
  # end

  # DELETE /job_descriptions/1
  # def destroy
  #   @job_description.destroy!
  # end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_job_description
      @job_description = current_user.job_descriptions.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def job_description_params
      params.expect(job_description: [ :title, :description, :resume_file])
    end
end
 
