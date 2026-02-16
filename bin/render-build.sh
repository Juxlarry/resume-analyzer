#!/usr/bin/env bash
# exit on error
set -o errexit

bundle install
bundle exec rake assets:precompile
bundle exec rake assets:clean

# Run database migrations
bundle exec rake db:migrate

# Create cache, queue, and cable databases if they don't exist
bundle exec rake db:create:cache
bundle exec rake db:create:queue
bundle exec rake db:create:cable

# Run migrations for solid_cache, solid_queue, solid_cable
bundle exec rake db:migrate:cache
bundle exec rake db:migrate:queue
bundle exec rake db:migrate:cable

# Seed the database (creates admin user)
bundle exec rake db:seed