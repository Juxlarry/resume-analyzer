import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { AsyncPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { JobService } from "../../services/job.service";
import { interval, Subscription, firstValueFrom } from "rxjs";
import { switchMap, takeWhile } from "rxjs/operators";
import { AlertService } from "../../services/alert.service";

declare const pdfjsLib: any;

@Component({
  selector: "app-job-form",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe],
  templateUrl: "./job-form.component.html",
  styleUrls: ["./job-form.component.css"],
})
export class JobFormComponent implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild("jdFileInput") jdFileInput!: ElementRef;

  jobForm: FormGroup;
  analysisResult: any = null;
  analysisJobId: number | null = null;
  isLoading = false;
  isAnalyzing = false;
  selectedFile: File | null = null;
  errorMessage: string | null = null;

  // ── Progress tracking ──────────────────────────────────────────
  progressStep = 0;

  readonly progressSteps = [
    { step: 1, label: "Parsing your resume..."              },
    { step: 2, label: "Reading the job description..."      },
    { step: 3, label: "Identifying keyword gaps..."         },
    { step: 4, label: "Calculating your ATS match score..." },
    { step: 5, label: "Generating your optimised resume..."  },
    { step: 6, label: "Your Hirivo ATS Report is ready."    },
  ];

  readonly progressTips = [
    "Over 70% of resumes are filtered by automated systems before a recruiter sees them. Hirivo is designed to change that.",
    "Hirivo checks keyword match, formatting compatibility, section structure, and job title alignment.",
    "Your optimised resume is built to pass Workday, Greenhouse, Taleo, Lever, and iCIMS screening systems.",
    "Hirivo serves job seekers across Africa and globally — from entry-level to executive, in every industry.",
    "Missing keywords are the most common reason a strong resume fails automated screening.",
  ];
  currentTipIndex = 0;
  private tipInterval?: ReturnType<typeof setInterval>;

  // JD PDF extraction state
  isExtractingJd = false;
  jdFileName: string | null = null;
  jdExtractionError: string | null = null;
  fieldsAutoFilled = false;

  private pollingSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    this.jobForm = this.fb.group({
      title:       ["", Validators.required],
      description: ["", [Validators.required, Validators.minLength(50)]],
      job_link:    [""],
    });
  }

  // ── Progress helpers ───────────────────────────────────────────
  get currentProgressLabel(): string {
    return this.progressSteps.find(s => s.step === this.progressStep)?.label ?? "";
  }

  get progressPercent(): number {
    return Math.round((Math.min(this.progressStep, 5) / 5) * 100);
  }

  private advanceToStep(step: number): void {
    this.progressStep = step;
    this.cdr.detectChanges();
  }

  private startTipRotation(): void {
    this.tipInterval = setInterval(() => {
      this.currentTipIndex = (this.currentTipIndex + 1) % this.progressTips.length;
      this.cdr.detectChanges();
    }, 6000);
  }

  private stopTipRotation(): void {
    if (this.tipInterval) {
      clearInterval(this.tipInterval);
      this.tipInterval = undefined;
    }
  }

  // ── JD PDF extraction ──────────────────────────────────────────
  async onJdFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      this.jdExtractionError = "Please upload a PDF file.";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.jdExtractionError = "File must be under 10MB.";
      return;
    }

    this.isExtractingJd = true;
    this.jdExtractionError = null;
    this.jdFileName = null;
    this.fieldsAutoFilled = false;

    try {
      const text = await this.extractTextFromPdf(file);
      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract enough text from this PDF.");
      }
      const parsed = await this.parseJobDescriptionWithAI(text);
      this.jobForm.patchValue({ title: parsed.title, description: parsed.description });
      this.jdFileName = file.name;
      this.fieldsAutoFilled = true;
      this.alertService.success("Job description extracted and filled successfully.");
      this.cdr.detectChanges();
    } catch (err: any) {
      this.jdExtractionError = err.message || "Failed to extract job description.";
      this.alertService.error(this.jdExtractionError!);
    } finally {
      this.isExtractingJd = false;
      this.jdFileInput.nativeElement.value = "";
    }
  }

  private extractTextFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
          }
          resolve(fullText.trim());
        } catch {
          reject(new Error("Failed to read PDF. Please ensure it is not password-protected."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsArrayBuffer(file);
    });
  }

  private async parseJobDescriptionWithAI(rawText: string): Promise<{ title: string; description: string }> {
    return firstValueFrom(this.jobService.parseJobDescriptionText(rawText));
  }

  // ── Resume file selection ──────────────────────────────────────
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (file.size > 10 * 1024 * 1024 || !allowedTypes.includes(file.type)) {
      this.alertService.error("Invalid file. Please upload a PDF or DOCX under 10MB.");
      this.selectedFile = null;
      this.fileInput.nativeElement.value = "";
      return;
    }
    this.selectedFile = file;
    this.errorMessage = null;
    this.alertService.success("File selected successfully.");
  }

  // ── Form submit ────────────────────────────────────────────────
  onSubmit(): void {
    if (this.jobForm.invalid || !this.selectedFile) {
      this.alertService.error("Please complete all required fields and upload your resume.");
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.advanceToStep(1);
    this.startTipRotation();

    const formData = new FormData();
    formData.append("job_description[title]",       this.jobForm.get("title")?.value);
    formData.append("job_description[description]", this.jobForm.get("description")?.value);
    const jobLink = this.jobForm.get("job_link")?.value?.trim();
    if (jobLink) formData.append("job_description[job_link]", jobLink);
    formData.append("job_description[resume]", this.selectedFile);

    this.jobService.createJobDescription(formData).subscribe({
      next: (response: any) => {
        this.analysisJobId = response.id ?? null;
        this.advanceToStep(2);
        this.triggerAnalysis(response.id);
      },
      error: (err) => {
        const msg = err.error?.errors?.join(", ") || "Submission failed. Please try again.";
        this.alertService.error(msg);
        this.resetProgress();
      },
    });
  }

  private triggerAnalysis(jobId: number): void {
    this.jobService.analyzeResume(jobId).subscribe({
      next: () => {
        this.advanceToStep(3);
        this.isAnalyzing = true;
        this.pollAnalysisStatus(jobId);
      },
      error: () => {
        this.alertService.error("Failed to start analysis. Please try again.");
        this.resetProgress();
      },
    });
  }

  private pollAnalysisStatus(jobId: number): void {
    let pollCount = 0;
    const maxPolls = 60;

    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.jobService.getAnalysisStatus(jobId)),
        takeWhile((response) => {
          pollCount++;
          if (pollCount === 3) this.advanceToStep(4);
          if (pollCount === 6) this.advanceToStep(5);

          if (pollCount >= maxPolls) {
            this.alertService.error("Analysis is taking longer than expected. Please try again later.");
            this.resetProgress();
            return false;
          }
          return response.status === "pending" || response.status === "processing";
        }, true)
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === "completed" && response.analysis) {
            this.advanceToStep(6);
            this.stopTipRotation();

            setTimeout(() => {
              this.analysisResult = response.analysis;
              this.isAnalyzing = false;
              this.isLoading = false;
              this.progressStep = 0;
              this.cdr.detectChanges();
              this.scrollToResults();
            }, 1200);

            this.pollingSubscription?.unsubscribe();

          } else if (response.status === "failed") {
            this.alertService.error(response.error || "Analysis failed. Please try again.");
            this.resetProgress();
            this.pollingSubscription?.unsubscribe();
          }
        },
        error: () => {
          this.alertService.error("Failed to fetch analysis status. Please refresh the page.");
          this.resetProgress();
          this.pollingSubscription?.unsubscribe();
        },
      });
  }

  private resetProgress(): void {
    this.progressStep = 0;
    this.isLoading = false;
    this.isAnalyzing = false;
    this.stopTipRotation();
    this.cdr.detectChanges();
  }

  formatVerdict(verdict: string): string {
    if (!verdict) return "";
    return verdict.replace(/_/g, " ");
  }

  printResults(): void {
    window.print();
  }

  private scrollToResults(): void {
    setTimeout(() => {
      const el = document.querySelector(".analysis-result");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  resetForm(): void {
    this.jobForm.reset();
    this.selectedFile = null;
    this.analysisResult = null;
    this.analysisJobId = null;
    this.errorMessage = null;
    this.jdFileName = null;
    this.jdExtractionError = null;
    this.fieldsAutoFilled = false;
    this.resetProgress();
    if (this.fileInput)   this.fileInput.nativeElement.value = "";
    if (this.jdFileInput) this.jdFileInput.nativeElement.value = "";
    this.pollingSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
    this.stopTipRotation();
  }
}