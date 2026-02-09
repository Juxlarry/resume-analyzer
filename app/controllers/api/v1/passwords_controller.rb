class Api::V1::PasswordsController < Devise::PasswordsController
    respond_to :json 
    # skip_before_action :verify_authenticity_token
    # skip_before_action :verify_authentication_token, raise: false

    #POST /api/v1/password
    def create 
        self.resource = resource_class.send_reset_password_instructions(resource_params)
        Rails.logger.info("Forgot password params: #{resource_params}")

        if successfully_sent?(resource)
            render json: {
                message: "Password reset instructions have been sent to your email."
            }, status: :ok
        else
            render json: {
                errors: resource.errors.full_messages
            }, status: :unprocessable_entity
        end 
    end 

    #PUT /api/v1/password
    def update
        self.resource = resource_class.reset_password_by_token(resource_params)

        if resource.errors.empty?
            resource.unlock_access! if unlockable?(resource)
            
            render json: {
                message: "Your password has been reset successfully."
            }, status: :ok
        else 
            render json: {
                errors: resource.errors.full_messages
            }, status: :unprocessable_entity
        end 
    end

    protected 

    def resource_params 
        params.require(:user).permit(:email, :password, :password_confirmation, :reset_password_token)
    end 
end 