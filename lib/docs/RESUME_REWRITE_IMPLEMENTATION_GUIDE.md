# Resume Rewrite Feature - Complete Implementation Guide

## 🎯 Feature Overview

This feature allows users to:
1. Review analysis suggestions and select which ones to accept
2. Add additional keywords they want included
3. Add new projects to showcase
4. Generate a rewritten resume in LaTeX format
5. Download the LaTeX code for compilation

---

## 📋 Backend Setup Checklist

### Step 1: Run Migration

```bash
rails db:migrate
```

### Step 2: Verify Template File

Make sure `lib/templates/resume_template.tex` exists:

```bash
ls lib/templates/resume_template.tex
```

If not, copy your LaTeX template there.

### Step 3: Update Models

Add the association to `ResumeAnalysis`:

```ruby
# app/models/resume_analysis.rb
has_many :resume_rewrites, dependent: :destroy
```

### Step 4: Add Routes

Add to your `config/routes.rb`:

```ruby
namespace :api do
  namespace :v1 do
    resources :resume_analyses, only: [] do
      resources :rewrites, controller: 'resume_rewrites', only: [:create, :index]
    end
    
    resources :resume_rewrites, only: [:show] do
      member do
        get :download
      end
    end
  end
end
```

### Step 5: Verify OpenAI API Key

Make sure `OPENAI_API_KEY` is set in your Railway environment variables.

### Step 6: Test in Rails Console

```ruby
rails console

# Find a completed analysis
analysis = ResumeAnalysis.completed.first

# Create a test rewrite
rewrite = analysis.resume_rewrites.create!(
  accepted_suggestions: ["Add more quantifiable achievements"],
  additional_keywords: ["Docker", "Kubernetes"],
  additional_projects: [{
    name: "Test Project",
    description: "A test project",
    technologies: "Rails, React",
    duration: "Jan 2024 - Mar 2024"
  }]
)

# Queue the job
ResumeRewriteJob.perform_now(rewrite.id)

# Check result
rewrite.reload
rewrite.status  # Should be 'completed'
rewrite.latex_code.present?  # Should be true
```

---

## 🎨 Frontend Implementation

### API Workflow

```
1. User completes analysis
   └─> GET /api/v1/job_descriptions/:id
       Returns analysis with suggestions

2. User selects suggestions/keywords/projects
   └─> POST /api/v1/resume_analyses/:id/rewrites
       {
         "resume_rewrite": {
           "accepted_suggestions": ["suggestion 1", "suggestion 2"],
           "additional_keywords": ["keyword1", "keyword2"],
           "additional_projects": [
             {
               "name": "Project Name",
               "description": "What it does",
               "technologies": "Tech stack",
               "duration": "Jan 2024 - Mar 2024"
             }
           ],
           "special_instructions": "Optional extra instructions"
         }
       }
       Returns: { id, status, status_url }

3. Poll for status
   └─> GET /api/v1/resume_rewrites/:id
       Returns current status + result if completed

4. Download LaTeX
   └─> GET /api/v1/resume_rewrites/:id/download
       Downloads .tex file
```

### Angular Component Example

```typescript
// resume-rewrite.component.ts
export class ResumeRewriteComponent implements OnInit {
  analysisId: number;
  analysis: any;
  
  // User selections
  selectedSuggestions: string[] = [];
  additionalKeywords: string[] = [];
  additionalProjects: Project[] = [];
  specialInstructions: string = '';
  
  // Rewrite status
  rewriteId: number | null = null;
  rewriteStatus: string = '';
  latexCode: string = '';
  
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit() {
    this.analysisId = this.route.snapshot.params['id'];
    this.loadAnalysis();
  }
  
  loadAnalysis() {
    this.http.get(`/api/v1/job_descriptions/${this.analysisId}`)
      .subscribe(response => {
        this.analysis = response;
      });
  }
  
  // Toggle suggestion selection
  toggleSuggestion(suggestion: string) {
    const index = this.selectedSuggestions.indexOf(suggestion);
    if (index > -1) {
      this.selectedSuggestions.splice(index, 1);
    } else {
      this.selectedSuggestions.push(suggestion);
    }
  }
  
  // Add keyword
  addKeyword(keyword: string) {
    if (keyword && !this.additionalKeywords.includes(keyword)) {
      this.additionalKeywords.push(keyword);
    }
  }
  
  // Add project
  addProject(project: Project) {
    this.additionalProjects.push(project);
  }
  
  // Submit rewrite request
  submitRewrite() {
    const payload = {
      resume_rewrite: {
        accepted_suggestions: this.selectedSuggestions,
        additional_keywords: this.additionalKeywords,
        additional_projects: this.additionalProjects,
        special_instructions: this.specialInstructions
      }
    };
    
    this.http.post(
      `/api/v1/resume_analyses/${this.analysis.resume_analysis.id}/rewrites`,
      payload
    ).subscribe(response => {
      this.rewriteId = response.id;
      this.pollStatus();
    });
  }
  
  // Poll for completion
  pollStatus() {
    const interval = setInterval(() => {
      this.http.get(`/api/v1/resume_rewrites/${this.rewriteId}`)
        .subscribe(response => {
          this.rewriteStatus = response.status;
          
          if (response.status === 'completed') {
            clearInterval(interval);
            this.latexCode = response.result.latex_code;
          } else if (response.status === 'failed') {
            clearInterval(interval);
            console.error('Rewrite failed:', response.error);
          }
        });
    }, 3000); // Poll every 3 seconds
  }
  
  // Download LaTeX file
  downloadLatex() {
    window.open(
      `/api/v1/resume_rewrites/${this.rewriteId}/download`,
      '_blank'
    );
  }
}
```

### Angular Template Example

```html
<!-- resume-rewrite.component.html -->
<div class="rewrite-container">
  <!-- Step 1: Select Suggestions -->
  <section class="suggestions-section">
    <h2>Select Improvements to Apply</h2>
    <div class="suggestion-list">
      <div *ngFor="let suggestion of parseSuggestions(analysis?.resume_analysis?.recommendations)"
           class="suggestion-item">
        <label>
          <input 
            type="checkbox"
            [checked]="selectedSuggestions.includes(suggestion)"
            (change)="toggleSuggestion(suggestion)">
          {{ suggestion }}
        </label>
      </div>
    </div>
  </section>
  
  <!-- Step 2: Add Keywords -->
  <section class="keywords-section">
    <h2>Add Keywords</h2>
    <div class="keyword-input">
      <input 
        #keywordInput
        type="text" 
        placeholder="Enter keyword"
        (keyup.enter)="addKeyword(keywordInput.value); keywordInput.value=''">
      <button (click)="addKeyword(keywordInput.value); keywordInput.value=''">
        Add
      </button>
    </div>
    <div class="keyword-chips">
      <span *ngFor="let keyword of additionalKeywords" class="chip">
        {{ keyword }}
        <button (click)="removeKeyword(keyword)">×</button>
      </span>
    </div>
    <div class="missing-keywords-hint">
      <p>Suggested missing keywords:</p>
      <button 
        *ngFor="let keyword of analysis?.resume_analysis?.missing_keywords"
        (click)="addKeyword(keyword)"
        class="btn-suggested">
        {{ keyword }}
      </button>
    </div>
  </section>
  
  <!-- Step 3: Add Projects -->
  <section class="projects-section">
    <h2>Add New Projects</h2>
    <div class="project-form">
      <input [(ngModel)]="newProject.name" placeholder="Project Name">
      <textarea [(ngModel)]="newProject.description" placeholder="Description"></textarea>
      <input [(ngModel)]="newProject.technologies" placeholder="Technologies (comma-separated)">
      <input [(ngModel)]="newProject.duration" placeholder="Duration (e.g., Jan 2024 - Mar 2024)">
      <button (click)="addProject(newProject); resetProjectForm()">
        Add Project
      </button>
    </div>
    <div class="project-list">
      <div *ngFor="let project of additionalProjects" class="project-card">
        <h4>{{ project.name }}</h4>
        <p>{{ project.description }}</p>
        <p><strong>Tech:</strong> {{ project.technologies }}</p>
        <p><strong>Duration:</strong> {{ project.duration }}</p>
        <button (click)="removeProject(project)">Remove</button>
      </div>
    </div>
  </section>
  
  <!-- Step 4: Special Instructions (Optional) -->
  <section class="instructions-section">
    <h2>Additional Instructions (Optional)</h2>
    <textarea 
      [(ngModel)]="specialInstructions"
      placeholder="Any specific formatting or content requests..."
      rows="4">
    </textarea>
  </section>
  
  <!-- Step 5: Submit -->
  <section class="submit-section">
    <button 
      (click)="submitRewrite()"
      [disabled]="!canSubmit()"
      class="btn-primary">
      Generate Rewritten Resume
    </button>
  </section>
  
  <!-- Step 6: Status Display -->
  <section *ngIf="rewriteId" class="status-section">
    <div *ngIf="rewriteStatus === 'pending' || rewriteStatus === 'processing'">
      <p>Generating your resume... This may take 2-3 minutes.</p>
      <div class="spinner"></div>
    </div>
    
    <div *ngIf="rewriteStatus === 'completed'">
      <h3>✅ Resume Generated Successfully!</h3>
      <button (click)="downloadLatex()" class="btn-download">
        Download LaTeX File
      </button>
      <details>
        <summary>Preview LaTeX Code</summary>
        <pre>{{ latexCode }}</pre>
      </details>
    </div>
    
    <div *ngIf="rewriteStatus === 'failed'" class="error">
      <p>❌ Generation failed. Please try again.</p>
    </div>
  </section>
</div>
```

---

## 🧪 Testing the Feature

### Test Case 1: Basic Rewrite

```bash
curl -X POST http://localhost:3000/api/v1/resume_analyses/1/rewrites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_rewrite": {
      "accepted_suggestions": [
        "Add more quantifiable achievements"
      ],
      "additional_keywords": ["Docker", "Kubernetes"],
      "additional_projects": []
    }
  }'
```

### Test Case 2: Check Status

```bash
curl http://localhost:3000/api/v1/resume_rewrites/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Case 3: Download LaTeX

```bash
curl -O http://localhost:3000/api/v1/resume_rewrites/1/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💰 Cost Considerations

**GPT-4o Pricing:**
- Input: $5 per 1M tokens
- Output: $15 per 1M tokens

**Typical Resume Rewrite:**
- Input: ~3,000 tokens (original resume + template + instructions)
- Output: ~1,500 tokens (LaTeX code)
- **Cost per rewrite: ~$0.03 - $0.05**

**Monthly estimate (100 rewrites):** ~$3-5

---

## 🔧 Optional Enhancements

### 1. PDF Compilation

Add a service to compile LaTeX to PDF:

```ruby
# app/services/latex_compiler_service.rb
class LatexCompilerService
  def self.compile(latex_code)
    # Use a service like LaTeX.Online API
    # or host your own pdflatex
  end
end
```

### 2. Version History

Track multiple rewrites:

```ruby
# Already supported - just create multiple rewrites
# Each rewrite is saved in database
```

### 3. Side-by-Side Comparison

Show before/after comparison in frontend.

### 4. Export to Overleaf

Integrate with Overleaf API to open in Overleaf editor.

---

## 🐛 Troubleshooting

### Issue: "Template file not found"

**Solution:**
```bash
# Make sure template exists
ls lib/templates/resume_template.tex

# Copy your template
cp /path/to/your/template.tex lib/templates/resume_template.tex
```

### Issue: LaTeX generation fails

**Check:**
1. OpenAI API key is valid
2. Original resume text extracted successfully
3. Check Sidekiq logs for errors

### Issue: Invalid LaTeX output

The service validates basic LaTeX structure. If invalid:
1. Check OpenAI response in logs
2. Verify template file is correct
3. May need to adjust temperature or prompt

---

## 📚 Additional Resources

**LaTeX Compilation:**
- Overleaf: https://www.overleaf.com
- LaTeX.Online: https://latexonline.cc
- TeXLive: Install locally for PDF generation

**Testing LaTeX:**
```bash
# Test locally
pdflatex resume.tex
```

---

## ✅ Summary

Your resume rewrite feature is now ready! Users can:
1. ✅ Select which AI suggestions to apply
2. ✅ Add keywords for ATS optimization
3. ✅ Add new projects to showcase
4. ✅ Generate LaTeX resume in minutes
5. ✅ Download and compile with any LaTeX editor

**Next steps:**
1. Run migrations
2. Add routes
3. Build Angular UI
4. Test the workflow
5. Deploy to Railway

Good luck! 🚀
