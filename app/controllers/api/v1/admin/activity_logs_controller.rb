class Api::V1::Admin::ActivityLogsController < Api::V1::Admin::BaseController
  def index
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 50
    action_filter = params[:action]
    user_filter = params[:user_id]

    logs = AdminActivityLog.includes(:user).recent

    logs = logs.by_action(action_filter) if action_filter.present?
    logs = logs.by_user(user_filter) if user_filter.present?

    total_count = logs.count
    logs = logs.offset((page - 1) * per_page).limit(per_page)

    render json: {
      logs: logs.as_json(
        include: {
          user: { only: [:id, :email] }
        },
        methods: [:formatted_details]
      ),
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  def stats
    render json: {
      total_actions: AdminActivityLog.count,
      today_actions: AdminActivityLog.where('created_at >= ?', Time.zone.now.beginning_of_day).count,
      action_breakdown: AdminActivityLog.group(:action).count,
      recent_admins: AdminActivityLog.recent.limit(10).includes(:user).map { |log|
        {
          admin_email: log.user.email,
          action: log.action,
          created_at: log.created_at
        }
      }
    }
  end
end