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
git clone https://github.com/yourusername/cv-analysis-tool.git
cd cv-analysis-tool