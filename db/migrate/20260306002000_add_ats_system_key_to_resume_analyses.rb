class AddAtsSystemKeyToResumeAnalyses < ActiveRecord::Migration[8.1]
  def change
    add_column :resume_analyses, :ats_system_key, :string
  end
end
