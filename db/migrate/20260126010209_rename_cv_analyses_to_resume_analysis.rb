class RenameCvAnalysesToResumeAnalysis < ActiveRecord::Migration[8.1]
  def change
    rename_table :cv_analyses, :resume_analyses
  end
end
