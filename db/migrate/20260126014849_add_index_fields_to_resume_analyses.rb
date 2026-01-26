class AddIndexFieldsToResumeAnalyses < ActiveRecord::Migration[8.1]
  def change

    # Add index for faster queries
    add_index :resume_analyses, :job_description_id, unique: true unless index_exists?(:resume_analyses, :job_description_id)
    
  end
end
