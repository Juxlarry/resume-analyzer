class Api::V1::UsersController < ApplicationController
    before_action :authenticate_user!

    # GET /api/v1/profile
    def show
      if current_user
        render json: {
        id: current_user.id,
        email: current_user.email,
        role: current_user.role,
        created_at: current_user.created_at, 
        total_analyses: current_user.job_descriptions.count,
        completed_analyses: current_user.resume_analyses.completed.count, 
        two_factor_enabled: current_user.otp_required_for_login
      }
      else
        render json: { error: 'Not authenticated' }, status: :unauthorized
      end
    end 

    # PUT /api/v1/profile
    def update
      if current_user.update(user_params)
        render json: {
          message: 'Profile updated successfully',
          user: { 
            id: current_user.id,
            email: current_user.email,
            role: current_user.role
          }
        }
      else
        render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    private
    
    def user_params
      params.require(:user).permit(:email, :password, :password_confirmation )
    end
end
