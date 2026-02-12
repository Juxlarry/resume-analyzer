class Api::V1::Admin::UsersController < Api::V1::Admin::BaseController  
    before_action :set_user, only: %i[ show update destroy ]

    def index 
        users = User.all.order(created_at: :desc)

        render json: users.as_json(
            only: [:id, :email, :role, :sign_in_count,:last_sign_in_at, :created_at, :otp_required_for_login]
        )
    end 

    # def show 
    #     render json: @user
    # end 

    def update 
        if @user.update(user_params)
            render json: { message: "User role updated to #{user.role}", user: @user }
        else 
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end 
    end 

    def destroy 
        @user.destroy 
        head :no_content
        render json: { message: 'User account deleted successfully' }
    end 


    private 

    def set_user
      @user = User.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "User not found" }, status: :not_found
    end

    def user_params
        params.require(:user).permit(:role)
    end
end 