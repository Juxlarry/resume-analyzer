class ApplicationController < ActionController::API
 
    before_action :configure_permitted_parameters, if: :devise_controller?

    respond_to :json

    private

    def configure_permitted_parameters
        devise_parameter_sanitizer.permit(:sign_up, keys: [:role])
        devise_parameter_sanitizer.permit(:account_update, keys: [:role])
    end
end
