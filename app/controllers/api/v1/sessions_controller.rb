class Api::V1::SessionsController < Devise::SessionsController
    respond_to :json

    private

    def respond_with(resource, _opts = {})
        # The token is automatically added to response headers by devise-jwt
        # We just need to also include it in the response body for convenience
        token = request.env['warden-jwt_auth.token']
        
        render json: {
        message: 'Logged in successfully',
        user: {
            id: resource.id,
            email: resource.email,
            role: resource.role
        },
        token: token
        }, status: :ok
    end

    def respond_to_on_destroy
        render json: {
        message: 'Logged out successfully'
        }, status: :ok
    end
end
