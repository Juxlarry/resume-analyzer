class JobDescriptionSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :created_at, :has_resume

  has_one :resume_analysis

  def has_resume
    object.resume.attached?
  end
end