import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { JobService } from "../../services/job.service";

@Component({
    selector: "app-job-form",
    templateUrl: "./job-form.component.html",
    styleUrls: ["./job-form.component.css"],
})

export class JobFormComponent {
    jobForm: FormGroup;
    analysisResult: any = null;
    isLoading: boolean = false
    selectedFile: File | null = null;

    constructor(
        private fb: FormBuilder,
        private jobService: JobService
    ) {
        this.jobForm = this.fb.group({
            title: ["", Validators.required],
            description: ["", Validators.required]
            // resume_file: [null, Validators.required],
        });
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    onSubmit(): void {
        if (this.jobForm.valid) {
            this.isLoading = true;
            const formData = new FormData();
            formData.append("job_description[title]", this.jobForm.get("title")?.value);
            formData.append("job_description[description]", this.jobForm.get("description")?.value);

            if (this.selectedFile) {
                formData.append("job_description[resume_file]", this.selectedFile);
            }

            this.jobService.createJobDescription(formData).subscribe({
                next: (response: any) => {
                    //trigger analysis

                    this.jobService.analyzeResume(response.id).subscribe({
                        next: (analysis) => {
                            this.analysisResult = analysis;
                            this.isLoading = false;
                        },
                        error: (err) => {
                            console.error("Error during resume analysis:", err);
                            this.isLoading = false;
                        }
                    });
                },
                error: (err) => {
                    console.error("Submission failed: ", err);
                    this.isLoading = false;
                }
            });
        }
    }
}