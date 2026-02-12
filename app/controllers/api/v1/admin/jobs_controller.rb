class Api::V1::Admin::JobsController < Api::V1::Admin::BaseController 
    def index
        jobs = JobDescription.includes(:user, :resume_analysis).order(created_at: :desc)
        
            render json: jobs.map { |job|
            {
                id: job.id,
                title: job.title,
                user_email: job.user.email,
                created_at: job.created_at,
                has_resume: job.resume.attached?,
                analysis_status: job.resume_analysis&.status || 'not_started',
                match_score: job.resume_analysis&.match_score
            }
        }
    end

    def destroy
        job = JobDescription.find(params[:id])
        job.destroy
        render json: { message: 'Job description and analysis data deleted' }
    end
end