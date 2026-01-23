class CvAnalysis < ApplicationRecord
    belongs_to :job_description

    enum status: {pending: 0, processing: 1, completed: 2, failed: 3 }

    validates :job_description_id, presence: true, uniqueness: true

    after_initialize :set_default_status, if: :new_record?

    private 

    def set_default_status
        self.status ||= :pending
    end 
end
