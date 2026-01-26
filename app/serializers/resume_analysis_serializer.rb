class ResumeAnalysisSerializer < ActiveModel::Serializer
  attributes :id, :status, :match_score, :verdict, :summary,
             :strengths, :weaknesses, :recommendations,
             :missing_keywords, :ai_model_used, :created_at, :updated_at, :score_color, :score_label

  def missing_keywords
    object.missing_keywords || []
  end

  def score_color
    object.score_color
  end 

  def score_label
    object.score_label
  end
end