class JobDescription < ApplicationRecord
    belongs_to :user

    has_one_attached :resume
    has_one :resume_analysis, dependent: :destroy

    validates :title, presence: true
    validates :description, presence: true, length: { minimum: 50 }
    validate :validate_resume_format, if: :resume_attached?

    # Delegate for easier access
    delegate :completed?, :processing?, :failed?, :pending?, to: :resume_analysis, prefix: true, allow_nil: true

    def extract_resume_text
        return nil unless resume.attached? 

        ResumeParserService.extract_text(resume)
    end 

    def analysis_ready? 
        resume_analysis&.completed? && resume_analysis.match_score.present?
    end 

    def resume_attached?
        resume.attached?
    end

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

        #Validate actual file content (not just extension)
        validate_file_signature
    end

    def validate_file_signature
        return unless resume.attached?

        resume.open do |file| 
            signature = file.read(4)

            is_pdf = signature&.start_with?("%PDF")
            is_docx = signature&.start_with?("PK")
            is_doc = signature&.bytes&.first(4) == [0xD0, 0xCF, 0x11, 0xE0]

            unless is_pdf || is_docx || is_doc
                errors.add(:resume, "file appears to be corrupted or has an invalid format")
            end 
        end 
    rescue => e
        Rails.logger.error "File signature validation error: #{e.message}"
        errors.add(:resume, "could not validate file format")
    end
end 
