class Api::V1::Admin::BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :require_admin!
      before_action :log_admin_access

    private 

    def require_admin!
        unless current_user&.admin?
        render json: { error: "Access denied. Admin privileges required." }, status: :forbidden
        end
    end

    def log_admin_access
        Rails.logger.info "[ADMIN ACCESS] User: #{current_user&.email}, Action: #{action_name}, Controller: #{controller_name}, IP: #{request.remote_ip}"
    end
end 