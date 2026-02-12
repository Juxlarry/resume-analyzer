class Api::V1::Admin::BaseController < ApplicationController
    before_action :authenticate_user!
    before_action :require_admin!

    private 

    def require_admin!
        unless current_user&.admin?
        render json: { error: "Access denied. Admin privileges required." }, status: :forbidden
        end
    end
end 