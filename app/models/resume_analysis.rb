class ResumeAnalysis < ApplicationRecord
    belongs_to :job_description

    enum status: {pending: 0, processing: 1, completed: 2, failed: 3 }

    validates :job_description_id, presence: true, uniqueness: true

    after_initialize :set_default_status, if: :new_record?

    # Serialize missing_keywords as array
    serialize :missing_keywords, coder: JSON

    # Scopes
    scope :completed, -> { where(status: :completed) }
    scope :failed, -> { where(status: :failed) }
    scope :recent, -> { order(created_at: :desc) }

    # Validations for completed analyses
    validates :match_score, numericality: { 
        greater_than_or_equal_to: 0, 
        less_than_or_equal_to: 100 
    }, if: :completed?
    
    validates :verdict, inclusion: { 
        in: %w[STRONG_MATCH GOOD_MATCH PARTIAL_MATCH WEAK_MATCH] 
    }, allow_nil: true

    def score_color
        case match_score
            when 90..100 then 'green'
            when 70..89 then 'blue'
            when 50..69 then 'yellow'
        else 'red'
        end
    end

    def score_label
        case match_score
            when 90..100 then 'Excellent'
            when 70..89 then 'Good'
            when 50..69 then 'Fair'
        else 'Poor'
        end
    end

    private 

    def set_default_status
        self.status ||= :pending
    end 
end
