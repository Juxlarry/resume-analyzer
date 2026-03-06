class JobDescription < ApplicationRecord
    MAX_JOB_LINK_LENGTH = 1000

    belongs_to :user

    has_one_attached :resume
    has_one :resume_analysis, dependent: :destroy

    before_validation :sanitize_job_link

    validates :title, presence: true
    validates :description, presence: true, length: { minimum: 50 }
    validates :job_link, length: { maximum: MAX_JOB_LINK_LENGTH }, allow_blank: true
    validate :validate_resume_format, if: :resume_attached?
    validate :validate_job_link_content

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
    def sanitize_job_link
        return if job_link.nil?

        cleaned = job_link.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
        cleaned = ActionController::Base.helpers.strip_tags(cleaned)
        cleaned = cleaned.gsub(/[\u0000-\u001F\u007F]/, " ").squish

        self.job_link = cleaned.presence
    end

    def validate_job_link_content
        return if job_link.blank?

        if looks_like_url?(job_link)
            validate_safe_url(job_link)
        else
            validate_safe_text(job_link)
        end
    end

    def looks_like_url?(value)
        value.match?(/\Ahttps?:\/\//i)
    end

    def validate_safe_url(value)
        uri = URI.parse(value)

        unless uri.is_a?(URI::HTTP) && uri.host.present?
            errors.add(:job_link, "must be a valid http(s) URL or plain text")
            return
        end

        if uri.userinfo.present?
            errors.add(:job_link, "must not include embedded credentials")
        end
    rescue URI::InvalidURIError
        errors.add(:job_link, "must be a valid http(s) URL or plain text")
    end

    def validate_safe_text(value)
        if value.match?(/\A[a-z][a-z0-9+\-.]*:/i)
            errors.add(:job_link, "URL scheme is not allowed. Use http(s) URL or plain text")
            return
        end

        if value.match?(/[<>]/)
            errors.add(:job_link, "must not contain HTML tags")
        end
    end

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
