class JobDescription < ApplicationRecord
    has_one_attached :resume
    has_one :resume_analysis, dependent: :destroy

    validates :title, presence: true
    validates :description, presence: true
    validates : validate_resume_format
    
    private 

    def validate_resume_format
        return unless resume.attached?

        acceptable_types = [
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]

        unless acceptable_types.include?(resume.content_type)
            errors.add(:resume, "must be a PDF or Word document")
        end

        if resume.byte_size > 10.megabytes
            errors.add(:resume, "is too large. Maximum size is 10MB.")
        end
    end
end 
