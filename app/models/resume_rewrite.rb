class ResumeRewrite < ApplicationRecord
  belongs_to :resume_analysis
  has_one_attached :pdf_file

  enum :status, { pending: 0, processing: 1, completed: 2, failed: 3 }, default: :pending

  validate :at_least_one_input_present
  validate :validate_input_types
  validate :validate_projects_shape

  before_validation :normalize_input_arrays

  scope :recent, -> { order(created_at: :desc) }

  def input_counts
    {
      accepted_suggestions_count: accepted_suggestions.size,
      additional_keywords_count: additional_keywords.size,
      additional_projects_count: additional_projects.size,
      has_special_instructions: special_instructions.present?
    }
  end

  def has_pdf?
    pdf_file.attached?
  end

  private

  def normalize_input_arrays
    self.accepted_suggestions = normalize_string_array(accepted_suggestions)
    self.additional_keywords = normalize_string_array(additional_keywords)
    self.additional_projects = normalize_project_array(additional_projects)
    self.special_instructions = special_instructions.to_s.strip.presence
  end

  def normalize_string_array(value)
    Array(value).map { |item| item.to_s.strip }.reject(&:blank?).uniq
  end

  def normalize_project_array(value)
    Array(value).map do |project|
      project.is_a?(Hash) ? project.stringify_keys.slice("name", "description", "technologies", "duration") : {}
    end.reject(&:blank?)
  end

  def at_least_one_input_present
    return if accepted_suggestions.any? || additional_keywords.any? || additional_projects.any? || special_instructions.present?

    errors.add(:base, "Please provide at least one suggestion, keyword, project, or instruction")
  end

  def validate_projects_shape
    additional_projects.each_with_index do |project, index|
      name = project["name"].to_s.strip
      description = project["description"].to_s.strip

      if name.blank?
        errors.add(:additional_projects, "project #{index + 1} must include a name")
      end

      if description.blank?
        errors.add(:additional_projects, "project #{index + 1} must include a description")
      end
    end
  end

  def validate_input_types
    errors.add(:accepted_suggestions, "must be an array") unless accepted_suggestions.is_a?(Array)
    errors.add(:additional_keywords, "must be an array") unless additional_keywords.is_a?(Array)
    errors.add(:additional_projects, "must be an array") unless additional_projects.is_a?(Array)
  end
end
