# Create README.md
cat > README.md << 'EOF'
# CV Analysis Tool

A full-stack application that analyzes CVs/resumes against job descriptions using AI.

## Features

- **User Authentication**: Secure login/registration with Devise JWT
- **CV Upload**: Upload PDF/DOC/DOCX files
- **AI Analysis**: Integration with OpenAI GPT for CV analysis
- **Background Processing**: Sidekiq with Redis for async job processing
- **Rate Limiting**: Rack Attack for API protection
- **Responsive Frontend**: Angular SPA with real-time status polling

## Tech Stack

### Backend
- Ruby on Rails 7 (API mode)
- PostgreSQL
- Redis (for Sidekiq and caching)
- Sidekiq (background jobs)
- Devise JWT (authentication)
- Rack Attack (rate limiting)

### Frontend
- Angular 17+
- TypeScript
- RxJS (for polling)
- Bootstrap/Tailwind CSS

### AI/ML
- OpenAI GPT-4 API
- PDF/DOCX parsing

## Prerequisites

- Ruby 3.2+
- Node.js 18+
- PostgreSQL
- Redis
- OpenAI API key

## Installation

### Backend Setup

1. Clone the repository:
```bash
##git clone https://github.com/yourusername/cv-analysis-tool.git
##cd cv-analysis-tool

2. Install Ruby dependencies:

```bash
bundle install
Set up database:

bash
rails db:create db:migrate
Set up environment variables:

bash
cp .env.example .env
# Edit .env with your API keys
Start services:

bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - Rails
rails s

# Terminal 3 - Sidekiq
bundle exec sidekiq
Frontend Setup
Navigate to frontend directory:

bash
cd frontend  # if separate Angular project
Install dependencies:

bash
npm install
Start development server:

bash
ng serve
API Documentation
Authentication
POST /api/v1/signup - Register new user

POST /api/v1/login - Login user

DELETE /api/v1/logout - Logout user

Job Analysis
POST /api/v1/job_descriptions - Create job description + upload CV

POST /api/v1/job_descriptions/:id/analyze - Start CV analysis

GET /api/v1/job_descriptions/:id/analysis_status - Check analysis status

Environment Variables
env
DATABASE_URL=postgresql://localhost/cv_analysis_development
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY_BASE=your_rails_secret_key
License
MIT
EOF