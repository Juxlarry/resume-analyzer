class CreateResumeRewrites < ActiveRecord::Migration[8.1]
  def change
    create_table :resume_rewrites do |t|
      t.references :resume_analysis, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.jsonb :accepted_suggestions, null: false, default: []
      t.jsonb :additional_keywords, null: false, default: []
      t.jsonb :additional_projects, null: false, default: []
      t.text :special_instructions
      t.text :latex_code
      t.text :improvements_summary
      t.text :error_message
      t.string :ai_model
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.integer :total_tokens
      t.decimal :estimated_cost, precision: 10, scale: 6

      t.timestamps
    end

    add_index :resume_rewrites, :status
  end
end 
