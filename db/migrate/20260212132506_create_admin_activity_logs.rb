class CreateAdminActivityLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :admin_activity_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :action, null: false
      t.string :target_type
      t.integer :target_id
      t.jsonb :details, default: {}
      t.string :ip_address
      t.datetime :created_at, null: false
    end

    add_index :admin_activity_logs, :action
    add_index :admin_activity_logs, [:target_type, :target_id]
    add_index :admin_activity_logs, :created_at
  end
end
