import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-rerun-analysis-modal',
  standalone: true,
  imports: [],
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > 10 * 1024 * 1024 || !allowedTypes.includes(file.type)) {
      this.errorMessage = 'Invalid file. Please upload a PDF or DOCX under 10 MB.';
      this.selectedFile = null;
      if (this.fileInput) this.fileInput.nativeElement.value = '';
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
    this.confirm.emit(this.selectedFile);
    this.resetModal();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  private resetModal(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }
}