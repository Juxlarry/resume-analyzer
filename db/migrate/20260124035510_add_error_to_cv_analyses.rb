class AddErrorToCvAnalyses < ActiveRecord::Migration[8.1]
  def change
    add_column :cv_analyses, :error_messages, :text
  end
end
