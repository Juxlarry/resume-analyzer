class CreateCvAnalyses < ActiveRecord::Migration[8.1]
  def change
    create_table :cv_analyses do |t|
      t.bigint :job_description_id
      t.text :summary
      t.text :strengths
      t.text :weaknesses
      t.text :recommendations
      t.string :ai_model_used

      t.timestamps
    end
  end
end
