class AdminActivityLog < ApplicationRecord
    belongs_to :user

    scope :recent, -> { order(created_at: :desc) }
    scope :by_action, ->(action) { where(action: action) }
    scope :by_user, ->(user_id) { where(user_id: user_id) }


    enum action: {
        user_created: 0,
        user_updated: 1,
        user_deleted: 2,
        role_changed: 3,
        job_deleted: 4,
        analysis_viewed: 5,
        settings_changed: 6
    }

    # Log an admin action
    def self.log_action(user:, action:, target: nil, details: {}, ip_address: nil)
        create!(
            user: user,
            action: action,
            target_type: target&.class&.name,
            target_id: target&.id,
            details: details,
            ip_address: ip_address
        )
    end

    def formatted_details
        case action
        when 'role_changed'
            "Changed from #{details['old_role']} to #{details['new_role']}"
        when 'user_deleted'
            "Deleted user: #{details['email']} (#{details['role']})"
        when 'job_deleted'
            "Deleted job: #{details['title']}"
        else
            details.to_s
        end
    end
end
