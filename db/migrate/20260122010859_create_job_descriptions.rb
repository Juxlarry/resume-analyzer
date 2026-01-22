class CreateJobDescriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :job_descriptions do |t|
      t.string :title
      t.text :description
      t.integer :user_id

      t.timestamps
    end
  end
end
