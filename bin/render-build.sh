#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing gems"
bundle check || bundle install --jobs 4 --retry 3

echo "==> Precompiling assets"
bundle exec rails assets:precompile
bundle exec rails assets:clean

if [[ "${RUN_DB_PREPARE:-false}" == "true" ]]; then
  echo "==> Preparing database"
  bundle exec rails db:prepare
else
  echo "==> Skipping database preparation (RUN_DB_PREPARE is not true)"
fi

if [[ "${RUN_DB_SEED:-false}" == "true" ]]; then
  echo "==> Seeding database"
  bundle exec rails db:seed
else
  echo "==> Skipping database seeding (RUN_DB_SEED is not true)"
fi
