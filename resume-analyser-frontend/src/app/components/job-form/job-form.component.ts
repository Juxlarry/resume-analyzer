import { Component, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { JobService } from "../../services/job.service";
import { interval, Subscription } from "rxjs";
import { max, switchMap, takeWhile } from "rxjs/operators";
import { Alert, AlertService } from "../../services/alert.service";


@Component({
    selector: "app-job-form",
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule 
    ],
    templateUrl: "./job-form.component.html",
    styleUrls: ["./job-form.component.css"],
})

export class JobFormComponent {
    @ViewChild('fileInput') fileInput!: ElementRef;

    jobForm: FormGroup;
    analysisResult: any = null;
    isLoading: boolean = false;
    isAnalyzing: boolean = false;
    selectedFile: File | null = null;
    loadingMessage = 'Submitting...';
    analysisStatus = 'Processing your resume...';
    errorMessage: string | null = null;
    private pollingSubscription?: Subscription;

    constructor(
        private fb: FormBuilder,
        private jobService: JobService, 
        private cdr: ChangeDetectorRef, 
        private alertService: AlertService
    ) {
        this.jobForm = this.fb.group({
            title: ["", Validators.required],
            description: ["", [Validators.required, Validators.minLength(50)]],
            // resume_file: [null, Validators.required],
        });
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (!file) return; 

        //validate file type
        const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

        //validate file size (max 10MB)
        if(file.size > 10 * 1024 * 1024 || !allowedTypes.includes(file.type)){
            this.alertService.error("Invalid file. Please ensure it is a PDF/DOCX under 10MB.")
            this.selectedFile = null;
            this.fileInput.nativeElement.value = ''; 
            return;
        }

        this.selectedFile = file;
        this.errorMessage = null;
        this.alertService.success("File selected successfully!");
    }

    onSubmit(): void {
        if (this.jobForm.invalid || !this.selectedFile) {
            this.alertService.error("Please fill in all required fields and upload a resume.");
            return;
        }

        this.isLoading = true;
        this.errorMessage = null;
        this.loadingMessage = 'Uploading resume...';

        const formData = new FormData();
        formData.append("job_description[title]", this.jobForm.get("title")?.value);
        formData.append("job_description[description]", this.jobForm.get("description")?.value);
        formData.append("job_description[resume]", this.selectedFile);
        

        this.jobService.createJobDescription(formData).subscribe({
            next: (response: any) => { 
                   console.log("Job description created:", response);
                this.loadingMessage = 'Starting analysis...';
                
                this.triggerAnalysis(response.id);
            },
            error: (err) => {
                console.error("Submission failed:", err);
                const errorMsg = err.error?.errors?.join(", ") || "Failed to submit. Please try again.";

                this.alertService.error(errorMsg);
                this.isLoading = false;
            }
        });
    }

    private triggerAnalysis(jobId: number): void {
        this.jobService.analyzeResume(jobId).subscribe({
            next: (response: any) =>{
                console.log("Analysis started:", response);
                this.loadingMessage = 'Analyzing resume...';
                this.isAnalyzing = true;
                this.isLoading = true;

                this.pollAnalysisStatus(jobId);
            }, 
            error: (err) => {
                console.error("Analysis trigger failed:", err);

                this.alertService.error("Failed to start analysis. Please try again.");
                this.isLoading = false;
            }
        });
    }

    private pollAnalysisStatus(jobId: number): void {
        let pollCount = 0; 
        const maxPolls = 60;

        this.pollingSubscription = interval(5000)
            .pipe(
                switchMap(() => this.jobService.getAnalysisStatus(jobId)),
                takeWhile(response => {
                    pollCount++;

                    if (pollCount >= maxPolls) {
                        this.alertService.error("Analysis is taking longer than expected. Please try again later.");
                        return false;
                    }

                    return response.status === "pending" || response.status === "processing";
                }, true)
            )
            .subscribe({
                next: (response: any) => {
                    console.log("Polling response:", response);

                    if (response.status === 'completed' && response.analysis) {
                        this.analysisResult = response.analysis;
                        this.isAnalyzing = false;
                        this.isLoading = false;
                        this.cdr.detectChanges();
                        this.scrollToResults();
                        this.pollingSubscription?.unsubscribe();
                    } else if (response.status === 'failed') {
                        const errorMsg = response.error ||"Analysis failed. Please try again.";
                        this.alertService.error(errorMsg);
                       this.isAnalyzing = false;
                        this.isLoading = false;
                        this.pollingSubscription?.unsubscribe();
                    }else if (response.status === 'processing') {
                        this.analysisStatus = response.estimated_wait_time ? `Processing your resume... (Estimated wait time: ${response.estimated_wait_time} seconds)` : 'Processing your resume...';
                        this.isAnalyzing = true;
                    }
                }, 
                error: (err) => {
                    console.error("Error while polling analysis status:", err);
                
                    this.alertService.error("Failed to fetch analysis status. Please refresh the page.");
                    this.isAnalyzing = false;
                    this.pollingSubscription?.unsubscribe();
                }
            }
        );
    }

    formatVerdict(verdict: string): string {
        if (!verdict) return '';
        return verdict.replace('_', ' ');
    }

    printResults(): void {
        window.print();
    }

    private scrollToResults() {
    setTimeout(() => {
        const element = document.querySelector('.analysis-result');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

    resetForm(): void {
        this.jobForm.reset();
        this.selectedFile = null;
        this.analysisResult = null;
        this.isLoading = false;
        this.isAnalyzing = false;
        this.errorMessage = null;
        this.loadingMessage = 'Submitting...';
        this.analysisStatus = 'Processing your resume...';
        
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
        
        this.pollingSubscription?.unsubscribe();
    }

    ngOnDestroy(): void {
        this.pollingSubscription?.unsubscribe();
    }
}