class Api::V1::HealthController < ApplicationController
    def show
        render json: { 
            status: 'ok', 
            timestamp: Time.current.iso8601,
            environment: Rails.env,
            version: '1.0.0'
        }
    end
end 