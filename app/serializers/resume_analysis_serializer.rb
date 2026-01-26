class ResumeAnalysisSerializer < ActiveModel::Serializer
  attributes :id, :status, :match_score, :verdict, :summary,
             :strengths, :weaknesses, :recommendations,
             :missing_keywords, :ai_model_used, :created_at, :updated_at

  def missing_keywords
    object.missing_keywords || []
  end
end