# Create Admin User
admin_email = ENV.fetch('ADMIN_EMAIL', 'admin@example.com')
admin_password = ENV.fetch('ADMIN_PASSWORD', 'NotThis!@')

admin = User.find_or_initialize_by(email: admin_email)

if admin.new_record?
  admin.assign_attributes(
    password: admin_password,
    password_confirmation: admin_password,
    role: 'admin'
  )
  
  if admin.save
    puts "Admin user created successfully!"
    puts "Email: #{admin.email}"
    puts " IMPORTANT: Change the password after first login!"
  else
    puts "Failed to create admin user:"
    puts admin.errors.full_messages
  end
else
  puts "Admin user already exists: #{admin.email}"
end