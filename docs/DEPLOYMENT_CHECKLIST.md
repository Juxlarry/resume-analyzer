# Quick Deployment Checklist

## Before Deployment
- [ ] Get your `config/master.key` value
- [ ] Have your OpenAI API key ready
- [ ] Know your Angular frontend URL
- [ ] Make build script executable: `chmod +x bin/render-build.sh`
- [ ] Commit all files to git and push

## Files Added
- `render.yaml` - Render deployment configuration
- `bin/render-build.sh` - Build script
- `config/sidekiq.yml` - Sidekiq configuration
- `config/environments/production.rb` - Updated production config
- `config/initializers/cors.rb` - Updated CORS config
- `.env.example` - Environment variables template
- `RENDER_DEPLOYMENT.md` - Full deployment guide

## Deploy to Render
1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Click "Apply"

## Environment Variables to Set Manually

### Web Service:
```
RAILS_MASTER_KEY=<from config/master.key>
OPENAI_API_KEY=<your-openai-key>
SIDEKIQ_USERNAME=<choose-username>
SIDEKIQ_PASSWORD=<choose-strong-password>
FRONTEND_URL=https://your-angular-app.com
```

### Sidekiq Worker:
```
RAILS_MASTER_KEY=<same-as-web>
OPENAI_API_KEY=<same-as-web>
```

## After Deployment
- [ ] Test API: `https://your-app.onrender.com/up`
- [ ] Test Sidekiq: `https://your-app.onrender.com/sidekiq`
- [ ] Deploy Angular frontend to Vercel using root directory `resume-analyser-frontend`
- [ ] Set Vercel env vars: `API_BASE_URL`, `API_ADMIN_BASE_URL`, `API_DOCS_URL`, `SIDEKIQ_URL`
- [ ] Test file uploads
- [ ] Test resume analysis job

## Your API Endpoints
```
https://your-app.onrender.com/api/v1/signup
https://your-app.onrender.com/api/v1/login
https://your-app.onrender.com/api/v1/job_descriptions
https://your-app.onrender.com/sidekiq
```

## Common Issues
1. **502 Bad Gateway**: Service is spinning up (wait 30-60s)
2. **CORS errors**: Check FRONTEND_URL is set correctly
3. **JWT errors**: Verify DEVISE_JWT_SECRET_KEY is set
4. **Sidekiq not working**: Check Redis connection and REDIS_URL

## Need Help?
See full guide in `RENDER_DEPLOYMENT.md`
