class Api::V1::TwoFactorController < ApplicationController 
    before_action :authenticate_user!

    #GET /api/v1/two_factor/setup
    def setup
        current_user.generate_otp_secret
        current_user.save!

        user_uri = current_user.otp_provisioning_uri

        #Generate QR Code
        qr_code = RQRCode::QRCode.new(user_uri)

        #Convert to svg
        svg = qr_code.as_svg(
            color: '000', 
            shape_rendering: 'crispEdges', 
            module_size: 4, 
            standalone: true, 
            use_path: true
        )

        render json: {
            secret: current_user.otp_secret, 
            qr_code: svg, 
            provisioning_uri: user_uri
        }
    end


    #POST /api/v1/two_factor/enable 
    def enable 
        code = params[:code]

        unless current_user.verify_otp_code(code)
            return render json: {
                error: 'Invalid verification code'
            }, status: :unprocessable_entity
        end 

        #Generate backup codes
        backup_codes = current_user.generate_otp_backup_codes
        current_user.enable_two_factor!

        render json: {
            message: 'Two-factor authentication enabled successfully', 
            backup_codes: backup_codes
        }
    end 

    #DELETE /api/v1/two_factor/disable
    def disable 
        code_or_backup = params[:code]

        #Verify with OTP/backup code 
        valid = current_user.verify_otp_code(code_or_backup) || current_user.verify_backup_code(code_or_backup)

        unless valid 
            return render json: {
                error: 'Invalid verification code'
            }, status: :unprocessable_entity
        end 

        current_user.disable_two_factor!

        render json: {
            message: 'Two-factor authentication disabled successfully'
        }
    end 

    #GET /api/v1/two_factor/status
    def status
        render json: {
            enabled: current_user.otp_required_for_login, 
            has_backup_codes: current_user.otp_backup_codes.present?
        }
    end 

    #POST /api/v1/two_factor/regenerate_backup_codes
    def regenerate_backup_codes
        code = params[:code]

        unless current_user.verify_otp_code(code)
            return render json: {
                error: 'Invalid verification code'
            }, status: :unprocessable_entity
        end 

        backup_codes = current_user.generate_otp_backup_codes
        current_user.save!

        render json: {
            message: 'Backup codes regenerated successfully', 
            backup_codes: backup_codes
        }
    end 
end 