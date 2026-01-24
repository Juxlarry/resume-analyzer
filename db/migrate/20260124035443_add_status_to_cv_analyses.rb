class AddStatusToCvAnalyses < ActiveRecord::Migration[8.1]
  def change
    add_column :cv_analyses, :status, :integer
  end
end
