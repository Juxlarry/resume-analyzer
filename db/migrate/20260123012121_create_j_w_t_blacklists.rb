#migration file is name 'db/migrate/20240123_create_j_w_t_blacklists.rb' 
#Rails expects the migration file to be named with snake_case, but it converts that to CamelCase when looking for the class. The issue is that Rails converts jwt to Jwt (only first letter capitalized), but your class is named CreateJWTBlacklists (all caps JWT).
class CreateJWTBlacklists < ActiveRecord::Migration[8.1]
  def change
    create_table :jwt_blacklists do |t|
      t.string :jti, null: false
      t.datetime :exp, null: false

      t.timestamps
    end
    add_index :jwt_blacklists, :jti
  end
end
