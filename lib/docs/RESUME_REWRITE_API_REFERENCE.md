# Resume Rewrite API Reference

## 🎯 Quick API Overview

Base URL: `https://your-app.railway.app/api/v1`

All endpoints require JWT authentication via `Authorization: Bearer TOKEN` header.

---

## Endpoints

### 1. Create Resume Rewrite

**POST** `/resume_analyses/:resume_analysis_id/rewrites`

Start a new resume rewrite job.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "resume_rewrite": {
    "accepted_suggestions": [
      "Add more quantifiable achievements",
      "Include relevant technical keywords"
    ],
    "additional_keywords": [
      "Docker",
      "Kubernetes", 
      "AWS Lambda"
    ],
    "additional_projects": [
      {
        "name": "E-commerce Platform",
        "description": "Built a scalable e-commerce platform serving 10K+ users",
        "technologies": "Rails, React, PostgreSQL, Redis",
        "duration": "Jan 2024 - Mar 2024"
      }
    ],
    "special_instructions": "Emphasize leadership experience"
  }
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "status": "pending",
  "message": "Resume rewrite started in background",
  "status_url": "https://your-app.railway.app/api/v1/resume_rewrites/123",
  "estimated_wait_time": "2-3 minutes"
}
```

**Possible Errors:**
- `422 Unprocessable Entity` - Analysis not completed or validation failed
- `404 Not Found` - Resume analysis doesn't exist
- `401 Unauthorized` - Invalid or missing JWT token

---

### 2. Get Rewrite Status

**GET** `/resume_rewrites/:id`

Check the status and get the result if completed.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (Pending/Processing):**
```json
{
  "id": 123,
  "status": "processing",
  "created_at": "2026-02-23T10:00:00Z",
  "updated_at": "2026-02-23T10:00:30Z",
  "inputs": {
    "accepted_suggestions_count": 2,
    "additional_keywords_count": 3,
    "additional_projects_count": 1,
    "has_special_instructions": true
  },
  "estimated_wait_time": "Approximately 2-3 minutes"
}
```

**Response (Completed):**
```json
{
  "id": 123,
  "status": "completed",
  "created_at": "2026-02-23T10:00:00Z",
  "updated_at": "2026-02-23T10:02:45Z",
  "inputs": {
    "accepted_suggestions_count": 2,
    "additional_keywords_count": 3,
    "additional_projects_count": 1,
    "has_special_instructions": true
  },
  "result": {
    "improvements_summary": "Incorporated 2 suggested improvements. Added 3 keywords: Docker, Kubernetes, AWS Lambda. Added 1 new project(s)",
    "latex_code": "\\documentclass[letterpaper,11pt]{article}\n...",
    "download_url": "https://your-app.railway.app/api/v1/resume_rewrites/123/download",
    "tokens_used": 4521,
    "cost": 0.045,
    "ai_model": "gpt-4o"
  }
}
```

**Response (Failed):**
```json
{
  "id": 123,
  "status": "failed",
  "created_at": "2026-02-23T10:00:00Z",
  "updated_at": "2026-02-23T10:02:45Z",
  "inputs": {
    "accepted_suggestions_count": 2,
    "additional_keywords_count": 3,
    "additional_projects_count": 1,
    "has_special_instructions": false
  },
  "error": "OpenAI API error: Rate limit exceeded"
}
```

---

### 3. Download LaTeX File

**GET** `/resume_rewrites/:id/download`

Download the generated LaTeX file.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
- Content-Type: `application/x-latex`
- Content-Disposition: `attachment; filename="resume_rewrite_123_20260223.tex"`
- Body: Raw LaTeX code

**Possible Errors:**
- `404 Not Found` - Rewrite not completed yet or doesn't exist

---

### 4. List All Rewrites for an Analysis

**GET** `/resume_analyses/:resume_analysis_id/rewrites`

Get all rewrite attempts for a specific analysis.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "id": 125,
    "status": "completed",
    "created_at": "2026-02-23T14:30:00Z",
    "improvements_summary": "Incorporated 3 suggestions...",
    "completed": true
  },
  {
    "id": 123,
    "status": "completed",
    "created_at": "2026-02-23T10:00:00Z",
    "improvements_summary": "Incorporated 2 suggestions...",
    "completed": true
  },
  {
    "id": 121,
    "status": "failed",
    "created_at": "2026-02-22T16:20:00Z",
    "improvements_summary": null,
    "completed": false
  }
]
```

---

## Request/Response Field Descriptions

### Resume Rewrite Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accepted_suggestions` | Array[String] | Yes | List of suggestion texts user accepted |
| `additional_keywords` | Array[String] | No | Keywords to add to resume |
| `additional_projects` | Array[Object] | No | New projects to showcase |
| `special_instructions` | String | No | Extra instructions for AI |

### Project Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Project name |
| `description` | String | Yes | What the project does |
| `technologies` | String | No | Tech stack used |
| `duration` | String | No | Time period (e.g., "Jan 2024 - Mar 2024") |

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Queued, waiting to start |
| `processing` | AI is generating LaTeX |
| `completed` | Successfully generated |
| `failed` | Error occurred |

---

## Example Workflows

### Minimal Rewrite (Just Suggestions)

```bash
curl -X POST https://your-app.railway.app/api/v1/resume_analyses/1/rewrites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_rewrite": {
      "accepted_suggestions": [
        "Add more quantifiable achievements"
      ],
      "additional_keywords": [],
      "additional_projects": []
    }
  }'
```

### Full Rewrite (All Options)

```bash
curl -X POST https://your-app.railway.app/api/v1/resume_analyses/1/rewrites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_rewrite": {
      "accepted_suggestions": [
        "Add more quantifiable achievements",
        "Include relevant technical keywords",
        "Expand on project impact"
      ],
      "additional_keywords": [
        "Docker",
        "Kubernetes",
        "AWS Lambda",
        "CI/CD"
      ],
      "additional_projects": [
        {
          "name": "Resume Analyzer",
          "description": "Built AI-powered resume analysis tool with Rails and OpenAI",
          "technologies": "Rails, React, OpenAI, PostgreSQL",
          "duration": "Dec 2025 - Feb 2026"
        },
        {
          "name": "E-commerce Platform",
          "description": "Developed scalable marketplace serving 10K+ users",
          "technologies": "Rails, Angular, Stripe, S3",
          "duration": "Jun 2025 - Nov 2025"
        }
      ],
      "special_instructions": "Focus on leadership and team collaboration skills"
    }
  }'
```

### Poll for Completion

```bash
# Initial request
response=$(curl -X POST https://your-app.railway.app/api/v1/resume_analyses/1/rewrites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resume_rewrite": {...}}')

rewrite_id=$(echo $response | jq -r '.id')

# Poll every 5 seconds
while true; do
  status=$(curl https://your-app.railway.app/api/v1/resume_rewrites/$rewrite_id \
    -H "Authorization: Bearer TOKEN" | jq -r '.status')
  
  echo "Status: $status"
  
  if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
    break
  fi
  
  sleep 5
done
```

### Download Result

```bash
curl -O https://your-app.railway.app/api/v1/resume_rewrites/123/download \
  -H "Authorization: Bearer TOKEN"
```

---

## Rate Limits & Costs

### OpenAI API Costs

Using GPT-4o:
- **Per rewrite:** ~$0.03 - $0.05
- **100 rewrites/month:** ~$3 - $5

### Recommended Rate Limits

To control costs, consider:
- Max 5 rewrites per user per day
- Max 1 rewrite per analysis per hour

Implement in controller:
```ruby
# In ResumeRewritesController
def create
  # Check rate limit
  recent_count = @resume_analysis.resume_rewrites
                                  .where('created_at > ?', 1.hour.ago)
                                  .count
  
  if recent_count >= 1
    return render json: { 
      error: "Please wait 1 hour between rewrites" 
    }, status: :too_many_requests
  end
  
  # ... rest of create action
end
```

---

## Testing Examples

### JavaScript/Fetch

```javascript
// Create rewrite
const response = await fetch('/api/v1/resume_analyses/1/rewrites', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    resume_rewrite: {
      accepted_suggestions: ['Add quantifiable achievements'],
      additional_keywords: ['Docker', 'AWS'],
      additional_projects: []
    }
  })
});

const { id, status_url } = await response.json();

// Poll for completion
const pollStatus = async () => {
  const statusResponse = await fetch(`/api/v1/resume_rewrites/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await statusResponse.json();
  
  if (data.status === 'completed') {
    console.log('LaTeX code:', data.result.latex_code);
    return data;
  } else if (data.status === 'failed') {
    console.error('Failed:', data.error);
    return null;
  } else {
    // Still processing, check again in 3 seconds
    setTimeout(pollStatus, 3000);
  }
};

pollStatus();
```

### Python/Requests

```python
import requests
import time

BASE_URL = 'https://your-app.railway.app/api/v1'
headers = {'Authorization': f'Bearer {token}'}

# Create rewrite
response = requests.post(
    f'{BASE_URL}/resume_analyses/1/rewrites',
    headers=headers,
    json={
        'resume_rewrite': {
            'accepted_suggestions': ['Add quantifiable achievements'],
            'additional_keywords': ['Docker', 'AWS'],
            'additional_projects': []
        }
    }
)

rewrite_id = response.json()['id']

# Poll for completion
while True:
    status_response = requests.get(
        f'{BASE_URL}/resume_rewrites/{rewrite_id}',
        headers=headers
    )
    
    data = status_response.json()
    
    if data['status'] == 'completed':
        print('LaTeX code:', data['result']['latex_code'])
        break
    elif data['status'] == 'failed':
        print('Error:', data['error'])
        break
    
    time.sleep(3)

# Download file
download_response = requests.get(
    f'{BASE_URL}/resume_rewrites/{rewrite_id}/download',
    headers=headers
)

with open('resume.tex', 'wb') as f:
    f.write(download_response.content)
```

---

## Response Time Expectations

| Operation | Expected Time |
|-----------|---------------|
| Create rewrite | < 1 second |
| Generation (background) | 2-3 minutes |
| Status check | < 100ms |
| Download | < 1 second |

---

## Error Handling Best Practices

```javascript
async function createRewrite(analysisId, rewriteData) {
  try {
    const response = await fetch(
      `/api/v1/resume_analyses/${analysisId}/rewrites`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resume_rewrite: rewriteData })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rewrite');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Rewrite creation failed:', error);
    // Show error to user
    alert(`Error: ${error.message}`);
    throw error;
  }
}
```

---

That's everything you need to integrate the Resume Rewrite API! 🚀
