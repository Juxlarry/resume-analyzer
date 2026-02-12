class Api::V1::Admin::JobsController < Api::V1::Admin::BaseController 
    def index
        jobs = JobDescription.includes(:user, :resume_analysis).order(created_at: :desc)

        # Filter by status if provided
        if params[:status].present? && params[:status] != 'all'
            jobs = jobs.joins(:resume_analysis).where(resume_analyses: { status: params[:status] })
        end
        
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

        # Log activity
        AdminActivityLog.log_action(
            user: current_user,
            action: :job_deleted,
            target: job,
            details: { title: job.title, user_email: job.user.email },
            ip_address: request.remote_ip
        )

        job.destroy
        render json: { message: 'Job description and analysis data deleted' }
    end

    def export
        require 'csv'

        jobs = JobDescription.includes(:user, :resume_analysis).order(created_at: :desc)

        csv_data = CSV.generate(headers: true) do |csv|
            csv << ['ID', 'Title', 'User Email', 'Status', 'Match Score', 'Verdict', 'Created At']
        
            jobs.each do |job|
                csv << [
                job.id,
                job.title,
                job.user.email,
                job.resume_analysis&.status || 'not_started',
                job.resume_analysis&.match_score,
                job.resume_analysis&.verdict,
                job.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ]
            end
        end

        # Log export
        AdminActivityLog.log_action(
            user: current_user,
            action: :settings_changed,
            details: { action: 'jobs_export', count: jobs.count },
            ip_address: request.remote_ip
        )

        send_data csv_data, 
                filename: "jobs_export_#{Date.today}.csv",
                type: 'text/csv',
                disposition: 'attachment'
    end
end