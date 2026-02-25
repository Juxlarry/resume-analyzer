class Api::V1::ResumeRewritesController < ApplicationController
  include Rails.application.routes.url_helpers

  before_action :authenticate_user!
  before_action :set_resume_analysis_for_nested_routes, only: %i[create index]
  before_action :set_resume_rewrite, only: %i[show download_latex download_pdf]

  # POST /api/v1/resume_analyses/:resume_analysis_id/rewrites 
  def create
    unless @resume_analysis.completed?
      return render json: { error: "Resume analysis must be completed before creating a rewrite" }, status: :unprocessable_entity
    end

    rewrite = @resume_analysis.resume_rewrites.new(resume_rewrite_params)
    rewrite.status = :pending

    if rewrite.save
      ResumeRewriteJob.perform_later(rewrite.id)

      render json: {
        id: rewrite.id,
        status: rewrite.status,
        message: "Resume rewrite started in background",
        status_url: api_v1_resume_rewrite_url(rewrite, host: request.base_url),
        estimated_wait_time: "2-3 minutes"
      }, status: :created
    else
      render json: { errors: rewrite.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/resume_analyses/:resume_analysis_id/rewrites
  def index
    rewrites = @resume_analysis.resume_rewrites.recent

    render json: rewrites.map { |rewrite| rewrite_list_item(rewrite) }
  end

  # GET /api/v1/resume_rewrites/:id
  def show
    response = {
      id: @resume_rewrite.id,
      status: @resume_rewrite.status,
      created_at: @resume_rewrite.created_at,
      updated_at: @resume_rewrite.updated_at,
      inputs: @resume_rewrite.input_counts
    }

    if @resume_rewrite.completed?
      response[:result] = {
        improvements_summary: @resume_rewrite.improvements_summary,
        latex_code: @resume_rewrite.latex_code,
        has_latex: @resume_rewrite.latex_code.present?,
        has_pdf: @resume_rewrite.pdf_file.attached?,
        download_urls: {
          latex: download_latex_api_v1_resume_rewrite_url(@resume_rewrite, host: request.base_url),
          pdf: download_pdf_api_v1_resume_rewrite_url(@resume_rewrite, host: request.base_url)
        },
        tokens_used: @resume_rewrite.total_tokens,
        cost: @resume_rewrite.estimated_cost.to_f,
        ai_model: @resume_rewrite.ai_model
      }
    elsif @resume_rewrite.failed?
      response[:error] = @resume_rewrite.error_message
    else
      response[:estimated_wait_time] = "Approximately 2-3 minutes"
    end

    render json: response
  end

  # GET /api/v1/resume_rewrites/:id/download/latex
  def download_latex
    unless @resume_rewrite.completed? && @resume_rewrite.latex_code.present?
      return render json: { error: "Rewrite is not completed yet" }, status: :not_found
    end

    filename = "resume_rewrite_#{@resume_rewrite.id}_#{Time.current.strftime('%Y%m%d')}.tex"
    send_data(
      @resume_rewrite.latex_code,
      filename: filename,
      type: "application/x-latex; charset=utf-8",
      disposition: "attachment"
    )
  end

  # GET /api/v1/resume_rewrites/:id/download/pdf
  def download_pdf
    unless @resume_rewrite.completed?
      return render json: { error: "Rewrite is not completed yet" }, status: :not_found
    end

    unless @resume_rewrite.pdf_file.attached?
      return render json: { error: "PDF is not available for this rewrite" }, status: :not_found
    end

    filename = "resume_rewrite_#{@resume_rewrite.id}_#{Time.current.strftime('%Y%m%d')}.pdf"
    send_data(
      @resume_rewrite.pdf_file.download,
      filename: filename,
      type: "application/pdf",
      disposition: "attachment"
    )
  end

  private

  def set_resume_analysis_for_nested_routes
    @resume_analysis = current_user.resume_analyses.find(params.expect(:resume_analysis_id))
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Resume analysis not found" }, status: :not_found
  end

  def set_resume_rewrite
    @resume_rewrite = ResumeRewrite
      .joins(resume_analysis: :job_description)
      .where(job_descriptions: { user_id: current_user.id })
      .find(params.expect(:id))
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Resume rewrite not found" }, status: :not_found
  end

  def resume_rewrite_params
    params.require(:resume_rewrite).permit(
      :special_instructions,
      accepted_suggestions: [],
      additional_keywords: [],
      additional_projects: %i[name description technologies duration]
    )
  end

  def rewrite_list_item(rewrite)
    {
      id: rewrite.id,
      status: rewrite.status,
      created_at: rewrite.created_at,
      improvements_summary: rewrite.improvements_summary,
      completed: rewrite.completed?
    }
  end
end
