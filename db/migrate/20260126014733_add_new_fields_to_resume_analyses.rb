class AddNewFieldsToResumeAnalyses < ActiveRecord::Migration[8.1]
  def change
    add_column :resume_analyses, :match_score, :integer
    add_column :resume_analyses, :missing_keywords, :text
    add_column :resume_analyses, :verdict, :string
  end
end
