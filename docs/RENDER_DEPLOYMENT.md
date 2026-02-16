# Render Deployment Guide for Resume Analyser API

## Prerequisites
1. GitHub account with your Rails repo
2. Render account (sign up at https://render.com)
3. Your Angular frontend URL (for CORS)

## Step 1: Prepare Your Repository

### 1.1 Add the deployment files to your repo:
```bash
# Make the build script executable
chmod +x bin/render-build.sh

# Add files to git
git add render.yaml
git add bin/render-build.sh
git add config/sidekiq.yml
git add config/environments/production.rb
git add config/initializers/cors.rb

git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Deploy to Render

### 2.1 Create a New Blueprint Instance
1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select your repository
5. Render will automatically detect `render.yaml`
6. Click "Apply"

### 2.2 This will create:
- ✅ PostgreSQL database (resume-analyser-db)
- ✅ Redis instance (resume-analyser-redis)
- ✅ Web service (resume-analyser-api)
- ✅ Background worker (resume-analyser-sidekiq)

## Step 3: Configure Environment Variables

### 3.1 Required Environment Variables to Add Manually:

Go to each service in Render dashboard and add these environment variables:

#### For Web Service (resume-analyser-api):
```
RAILS_MASTER_KEY=<your-master-key-from-config/master.key>
OPENAI_API_KEY=<your-openai-api-key>
SIDEKIQ_USERNAME=<choose-a-username>
SIDEKIQ_PASSWORD=<choose-a-strong-password>
FRONTEND_URL=https://your-angular-app.com
```

#### For Sidekiq Worker (resume-analyser-sidekiq):
```
RAILS_MASTER_KEY=<same-as-web-service>
OPENAI_API_KEY=<same-as-web-service>
```

### 3.2 Get your RAILS_MASTER_KEY:
```bash
# In your local project directory
cat config/master.key
```

If you don't have a master.key file:
```bash
EDITOR="code --wait" bin/rails credentials:edit
# This will create config/master.key
```

**IMPORTANT**: Never commit `config/master.key` to git!

## Step 4: Update Your Database Configuration

Your `config/database.yml` production section should work with Render's DATABASE_URL.
Render automatically sets DATABASE_URL, which Rails will use.

## Step 5: Initial Deployment

1. Render will automatically build and deploy your app
2. Watch the logs for any errors
3. Build process takes 5-10 minutes initially

## Step 6: Run Database Migrations

The build script (`bin/render-build.sh`) automatically runs:
- `rails db:migrate`
- Database setup for solid_cache, solid_queue, solid_cable

If you need to run migrations manually:
1. Go to your web service in Render dashboard
2. Click "Shell" tab
3. Run: `bundle exec rails db:migrate`

## Step 7: Access Your API

Your API will be available at:
```
https://resume-analyser-api.onrender.com
```

Test the health endpoint:
```bash
curl https://resume-analyser-api.onrender.com/up
```

## Step 8: Access Sidekiq Dashboard

Navigate to:
```
https://resume-analyser-api.onrender.com/sidekiq
```

Login with the SIDEKIQ_USERNAME and SIDEKIQ_PASSWORD you set.

## Step 9: Update Your Angular Frontend

Deploy the Angular app from `resume-analyser-frontend/` to Vercel and set:

### Vercel Project Settings
- Root Directory: `resume-analyser-frontend`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist/resume-analyser-frontend/browser`

### Vercel Environment Variables
Set these in Vercel (Production, and Preview if needed):

```bash
API_BASE_URL=https://resume-analyser-api.onrender.com/api/v1
API_ADMIN_BASE_URL=https://resume-analyser-api.onrender.com/api/v1/admin
API_DOCS_URL=https://resume-analyser-api.onrender.com/api-docs/v1/swagger.yaml
SIDEKIQ_URL=https://resume-analyser-api.onrender.com/sidekiq
```

The frontend reads these values at build time via `scripts/generate-env.mjs`.

## Important Notes

### Free Tier Limitations:
- Web services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- PostgreSQL: 1GB storage, expires after 90 days
- Redis: 25MB memory

### Upgrading to Paid Plans:
For production use, consider:
- **Starter Plan ($7/month per service)**: No spin-down, better performance
- **Standard Plan ($25/month per service)**: More resources, better uptime

### File Storage:
- Render uses ephemeral storage (files are lost on restart)
- For production, use cloud storage (AWS S3, Cloudinary, etc.)
- Update `config/storage.yml` and set `config.active_storage.service = :amazon` in production.rb

## Monitoring and Logs

### View Logs:
1. Go to service in Render dashboard
2. Click "Logs" tab
3. Real-time logs appear here

### Monitor Performance:
1. Click "Metrics" tab
2. View CPU, Memory, and Response times

## Troubleshooting

### Build Fails:
```bash
# Check the build logs in Render dashboard
# Common issues:
# - Missing environment variables
# - Database connection errors
# - Missing dependencies
```

### Database Connection Issues:
```bash
# In Render Shell:
bundle exec rails db:migrate:status
bundle exec rails console
# Try: ActiveRecord::Base.connection
```

### Sidekiq Not Processing Jobs:
1. Check Redis connection in logs
2. Verify REDIS_URL is set correctly
3. Check Sidekiq worker logs
4. Restart the worker service

### CORS Issues:
1. Verify FRONTEND_URL is set correctly
2. Check `config/initializers/cors.rb`
3. Ensure your Angular app uses the correct API URL

## Useful Commands

### Rails Console:
```bash
# In Render Shell
bundle exec rails console
```

### Database Reset (CAUTION):
```bash
bundle exec rails db:reset
```

### View Environment Variables:
```bash
env | grep RAILS
```

## Security Checklist

- [x] RAILS_MASTER_KEY set and not in git
- [x] Force SSL enabled in production.rb
- [x] Sidekiq dashboard protected with Basic Auth
- [x] CORS configured for your frontend only
- [x] Strong SIDEKIQ_PASSWORD set
- [x] Database credentials secured by Render
- [ ] Set up proper logging/monitoring
- [ ] Configure error tracking (Sentry, Bugsnag, etc.)
- [ ] Set up backups for PostgreSQL

## Next Steps

1. **Set up CI/CD**: Configure automatic deployments on git push
2. **Add monitoring**: Integrate with Sentry or Rollbar
3. **Configure email**: Set up SMTP for Devise emails
4. **Add file storage**: Configure S3 or Cloudinary
5. **Set up staging environment**: Create a separate Render blueprint for staging

## Support

- Render Docs: https://render.com/docs
- Rails Guides: https://guides.rubyonrails.org
- Sidekiq Docs: https://github.com/sidekiq/sidekiq/wiki

## Questions?
Common issues and solutions are in the "Troubleshooting" section above.
