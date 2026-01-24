class Api::V1::UsersController < ApplicationController
    before_action :authenticate_user!

    # GET /api/v1/profile
    def show
        puts "DEBUG: current_user = #{current_user.inspect}"
        puts "DEBUG: user_signed_in? = #{user_signed_in?}"

        if current_user
            render json: {
            id: current_user.id,
            email: current_user.email,
            role: current_user.role,
            created_at: current_user.created_at
            }
        else
          render json: { error: 'Not authenticated' }, status: :unauthorized
        end
    end

    # PUT /api/v1/profile
    def update
        if current_user.update(user_params)
          render json: {
            message: 'Profile updated',
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
        params.require(:user).permit(:role)
    end
end
