class CvAnalysesController < ApplicationController
  before_action :set_cv_analysis, only: %i[ show update destroy ]

  # GET /cv_analyses
  def index
    @cv_analyses = CvAnalysis.all

    render json: @cv_analyses
  end

  # GET /cv_analyses/1
  def show
    render json: @cv_analysis
  end

  # POST /cv_analyses
  def create
    @cv_analysis = CvAnalysis.new(cv_analysis_params)

    if @cv_analysis.save
      render json: @cv_analysis, status: :created, location: @cv_analysis
    else
      render json: @cv_analysis.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /cv_analyses/1
  def update
    if @cv_analysis.update(cv_analysis_params)
      render json: @cv_analysis
    else
      render json: @cv_analysis.errors, status: :unprocessable_content
    end
  end

  # DELETE /cv_analyses/1
  def destroy
    @cv_analysis.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_cv_analysis
      @cv_analysis = CvAnalysis.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def cv_analysis_params
      params.expect(cv_analysis: [ :job_description_id, :summary, :strengths, :weaknesses, :recommendations, :ai_model_used ])
    end
end
