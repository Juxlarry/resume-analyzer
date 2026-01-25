import { Component } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { JobService } from "../../services/job.service";


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

            //validate file size (max 10MB)
            if(file.size > 10 * 1024 * 1024){
                alert("File size exceeds 10MB limit. Please choose a smaller file.");
                return
            }

            //validate file type
            const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
            if(!allowedTypes.includes(file.type)){
                alert("Invalid file type. Please upload a PDF or DOCX file.");
                return
            }

            this.selectedFile = file;
        }
    }

    onSubmit(): void {
        if (this.jobForm.valid && this.selectedFile) {
            this.isLoading = true;
            const formData = new FormData();
            formData.append("job_description[title]", this.jobForm.get("title")?.value);
            formData.append("job_description[description]", this.jobForm.get("description")?.value);
            formData.append("job_description[resume_file]", this.selectedFile);
            

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
        }else {
            alert("Please fill in all required fields and upload a resume.");
        }
    }

    resetForm(): void {
        this.jobForm.reset();
        this.selectedFile = null;
        this.analysisResult = null;
        this.isLoading = false;
    }
}