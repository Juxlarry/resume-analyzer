class Api::V1::SessionsController < Devise::SessionsController
    respond_to :json

    def create 
        user = User.find_by(email: params[:user][:email])
        # token = request.env['warden-jwt_auth.token']

        unless user&.valid_password?(params[:user][:password])
            return render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
    
        #Check if 2FA is required
        if user.otp_required_for_login
            render json: {
                requires_otp: true, 
                otp_user_id: user.id,
                message: 'Please enter your two-factor authetication code'
            }, status: :ok
        else
            request.env['warden'].set_user(user, scope: :user, store: false)
            respond_with(user)
        end 
    end 

    #POST /api/v1/login/verify_otp
    def verify_otp
        user = User.find_by(id: params[:otp_user_id])
        code = params[:code]

        return render json: { error: 'Invalid User ID' }, status: :unauthorized unless user

        #Verify with OTP or backup code 
        if user.verify_otp_code(code) || user.verify_backup_code(code)
            request.env['warden'].set_user(user, scope: :user, store: false)
            Rails.logger.info request.env['warden-jwt_auth.token']
            respond_with(user)
        else
            render json: {
                error: 'Invalid verification code'
            }, status: :unauthorized
        end 
    end 


    private 

    def respond_with(resource, _opts = {})
        token = request.env['warden-jwt_auth.token']
        
        render json: {
        message: 'Logged in successfully',
        user: {
            id: resource.id,
            email: resource.email,
            role: resource.respond_to?(:role) ? resource.role : nil, 
            created_at: resource.created_at,
            updated_at: resource.updated_at
        },
        token: token
        }, status: :ok
    end

    def respond_to_on_destroy
        if current_user
            render json: {
            message: 'Logged out successfully'
            }, status: :ok
        else 
            render json: {
            error: 'No active session'
            }, status: :unauthorized
        end 
    end
end
