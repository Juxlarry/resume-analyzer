import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rerun-analysis-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rerun-analysis-modal.component.html',
  styleUrl: './rerun-analysis-modal.component.css',
})
export class RerunAnalysisModal {
  @Input() isOpen = false;
  @Input() jobTitle = '';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<File | null>();
  @ViewChild('fileInput') fileInput!: ElementRef;

  selectedFile: File | null = null;
  errorMessage: string | null = null;

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file){
      this.selectedFile = null;
      return; 
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (file.size > 10 * 1024 * 1024 || !allowedTypes.includes(file.type)) {
      this.errorMessage = "Invalid file. Please ensure it is a PDF/DOCX with max size of 10MB.";
      this.selectedFile = null;
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
      return;
    }

    this.selectedFile = file;
    this.errorMessage = null;
  }

  onClose(): void {
    this.resetModal();
    this.close.emit();
  }

  onConfirm(): void {
    // Emit the selected file (or null if user wants to use existing resume)
    this.confirm.emit(this.selectedFile);
    this.resetModal();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private resetModal(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}