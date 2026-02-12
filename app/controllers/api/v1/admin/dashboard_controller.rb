class Api::V1::Admin::DashboardController < Api::V1::Admin::BaseController 

    def stats
        render json: {
            stats: {
                total_users: User.count,
                active_users: User.where('last_sign_in_at > ?', 30.days.ago).count,
                total_analyses: ResumeAnalysis.count,
                today_analyses: ResumeAnalysis.where("created_at >= ?", Time.zone.now.beginning_of_day).count,
                week_analyses: ResumeAnalysis.where('created_at >= ?', 7.days.ago).count,
                avg_match_score: ResumeAnalysis.completed.average(:match_score).to_f.round(1) || 0, 
                success_rate: calculate_success_rate,
                users_with_2fa: User.where(otp_required_for_login: true).count
            }, 
            status_breakdown: status_breakdown,
            recent_activity: recent_logs,
            weekly_trend: weekly_trend_data
        }
    end

    private 

    def calculate_success_rate
        total = ResumeAnalysis.count 
        return 0 if total.zero?

        failed = ResumeAnalysis.where(status: :failed).count
        ((total - failed).to_f / total * 100).round(1)
    end 

    def status_breakdown
        {
        pending: ResumeAnalysis.where(status: :pending).count,
        processing: ResumeAnalysis.where(status: :processing).count,
        completed: ResumeAnalysis.where(status: :completed).count,
        failed: ResumeAnalysis.where(status: :failed).count
        }
    end

    def recent_logs
        #Fetches the last 10 completed analyses with user details 
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
                verdict: analysis.verdict,
                created_at: analysis.created_at
            }
        end 
    end 

    def weekly_trend_data
        (0..6).map do |days_ago|
        date = days_ago.days.ago.to_date
        {
            date: date,
            count: ResumeAnalysis.where(
            'DATE(created_at) = ?', date
            ).count
        }
        end.reverse
    end
end 