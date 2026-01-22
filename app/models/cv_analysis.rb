class CvAnalysis < ApplicationRecord
    belongs_to :job_description

    validates :job_description_id, presence: true, uniqueness: true
end
