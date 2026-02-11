class Api::V1::RegistrationsController < Devise::RegistrationsController 
  respond_to :json
  # skip_before_action 

  # Override to prevent automatic sign in after registration
  def create
    build_resource(sign_up_params)

    resource.save
    yield resource if block_given?
    
    if resource.persisted?
      render json: {
        message: 'Signed up successfully.',
        user: {
          id: resource.id,
          email: resource.email,
          role: resource.role
        }
      }, status: :created
    else
      clean_up_passwords resource
      render json: {
        message: 'Signup failed',
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def sign_up_params
    params.require(:user).permit(:email, :password, :password_confirmation)
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        message: 'Signed up successfully',
        user: {
          id: resource.id,
          email: resource.email,
          role: resource.role
        }
      }, status: :ok
    else
      render json: {
        message: 'Signup failed',
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end