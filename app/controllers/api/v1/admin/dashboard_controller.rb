class Api::V1::Admin::DashboardController < Api::V1::Admin::BaseController 

    def stats
        render json: {
            stats: {
                total_users: User.count,
                total_analyses: ResumeAnalysis.count,
                today_analyses: ResumeAnalysis.where("created_at >= ?", Time.zone.now.beginning_of_day).count,
                avg_match_score: ResumeAnalysis.completed.average(:match_score).to_f.round(1) || 0, 
                success_rate: calculate_success_rate 
            }, 
            recent_activity: recent_logs
        }
    end

    private 

    def calculate_success_rate
        total = ResumeAnalysis.count 
        return 0 if total.zero?

        failed = ResumeAnalysis.where(status: :failed).count
        ((total - failed).to_f / total * 100).round(1)
    end 

    def recent_logs
        #Fetches the last 5 completed analyses with user details 
        ResumeAnalysis.includes(job_description: :user)
        .where(status: :completed)
        .order(created_at: :desc)
        .limit(10)
        .map do |analysis|
            {
                id: analysis.job_description.id,
                job_title: analysis.job_description.title,
                user_email: analysis.job_description.user.email, 
                match_score: analysis.match_score,
                created_at: analysis.created_at
            }
        end 
    end 
end 