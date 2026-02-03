import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Alert, AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent implements OnInit{
  alerts$!: Observable<Alert[]>; 

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alerts$ = this.alertService.alerts$;
  }

  closeAlert(id: string): void {
    this.alertService.removeAlert(id);
  }

  getAlertClasses(type: string): string {
    const baseClasses = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm';
    
    const typeClasses = {
      success: 'bg-green-50 border-green-500 text-green-900',
      error: 'bg-red-50 border-red-500 text-red-900',
      warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
      info: 'bg-blue-50 border-blue-500 text-blue-900'
    };

    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses]}`;
  }

  getIconClasses(type: string): string {
    const typeClasses = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500'
    };

    return typeClasses[type as keyof typeof typeClasses];
  }
  
}
