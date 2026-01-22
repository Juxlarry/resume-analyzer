class JobDescriptionsController < ApplicationController
  before_action :set_job_description, only: %i[ show update destroy ]

  # GET /job_descriptions
  def index
    @job_descriptions = JobDescription.all

    render json: @job_descriptions
  end

  # GET /job_descriptions/1
  def show
    render json: @job_description
  end

  # POST /job_descriptions
  def create
    @job_description = JobDescription.new(job_description_params)

    if @job_description.save
      render json: @job_description, status: :created, location: @job_description
    else
      render json: @job_description.errors, status: :unprocessable_content
    end
  end

  # PATCH/PUT /job_descriptions/1
  def update
    if @job_description.update(job_description_params)
      render json: @job_description
    else
      render json: @job_description.errors, status: :unprocessable_content
    end
  end

  # DELETE /job_descriptions/1
  def destroy
    @job_description.destroy!
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_job_description
      @job_description = JobDescription.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def job_description_params
      params.expect(job_description: [ :title, :description, :user_id ])
    end
end
