class Api::V1::Admin::UsersController < Api::V1::Admin::BaseController  
    before_action :set_user, only: %i[ show update destroy ]

    def index
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        search = params[:search]
        
        # users = User.order(created_at: :desc)
        #             .offset((page - 1) * per_page)
        #             .limit(per_page)

        users = User.order(created_at: :desc)

        if search.present?
            users. users.where('email ILIKE ?', "%#{search}")
        end 

        total_count = users.count
        users = users.offset((page - 1) * per_page).limit(per_page)

        render json: {
            users: users.as_json(
                only: [:id, :email, :role, :sign_in_count, :last_sign_in_at, :created_at, :otp_required_for_login],
                methods: [:total_job_descriptions, :completed_analyses_count]
            ),
            pagination: {
                current_page: page,
                per_page: per_page,
                total_count: total_count,
                total_pages: (total_count.to_f / per_page).ceil
            }
        }
    end

    def show
        render json: @user.as_json(
            only: [:id, :email, :role, :sign_in_count, :last_sign_in_at, :current_sign_in_at, :created_at, :otp_required_for_login],
            include: {
                job_descriptions: {
                only: [:id, :title, :created_at],
                    include: {
                        resume_analysis:{
                            only: [
                                :status,:match_score, :verdict
                            ]
                        }
                    }
                }
            }
        )
    end 

    def update 
        old_role = @user.role 

        if @user.update(user_params)
            # Log activity
            AdminActivityLog.log_action(
                user: current_user,
                action: :role_changed,
                target: @user,
                details: { 
                    old_role: old_role, new_role: @user.role 
                },
                ip_address: request.remote_ip
            )

            render json: { message: "User role updated to #{user.role}", user: @user.as_json(only: [:id, :email, :role]) }
        else 
            render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
        end 
    end 

    def destroy 
        # Log activity before deletion
        AdminActivityLog.log_action(
            user: current_user,
            action: :user_deleted,
            target: @user,
            details: { email: @user.email, role: @user.role },
            ip_address: request.remote_ip
        )

        @user.destroy 
        render json: { message: 'User account deleted successfully' }
    end 

    # Export users to CSV
    def export
        require 'csv'

        users = User.order(created_at: :desc)
        
        if params[:search].present?
            users = users.where('email ILIKE ?', "%#{params[:search]}%")
        end

        csv_data = CSV.generate(headers: true) do |csv|
            csv << ['ID', 'Email', 'Role', 'Sign In Count', 'Last Sign In', '2FA Enabled', 'Created At']
        
            users.each do |user|
                csv << [
                user.id,
                user.email,
                user.role,
                user.sign_in_count || 0,
                user.last_sign_in_at&.strftime('%Y-%m-%d %H:%M:%S'),
                user.otp_required_for_login ? 'Yes' : 'No',
                user.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ]
            end
        end

        # Log export action
        AdminActivityLog.log_action(
            user: current_user,
            action: :settings_changed,
            details: { action: 'users_export', count: users.count },
            ip_address: request.remote_ip
        )

        send_data csv_data, 
            filename: "users_export_#{Date.today}.csv",
            type: 'text/csv',
            disposition: 'attachment'
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