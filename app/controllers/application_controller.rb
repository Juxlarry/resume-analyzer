class ApplicationController < ActionController::API
 
    before_action :configure_permitted_parameters, if: :devise_controller?

    before_action :authenticate_user!

    respond_to :json

    private

    def configure_permitted_parameters
    end

end