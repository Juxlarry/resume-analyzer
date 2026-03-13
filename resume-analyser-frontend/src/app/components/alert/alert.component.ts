import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Alert, AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css',
})
export class AlertComponent implements OnInit {
  alerts$!: Observable<Alert[]>;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alerts$ = this.alertService.alerts$;
  }

  closeAlert(id: string): void {
    this.alertService.removeAlert(id);
  }

  getAlertClasses(type: string): string {
    const base = 'flex items-start gap-3 p-4 rounded-lg shadow-md border-l-4';
    const map: Record<string, string> = {
      success: 'bg-hirivo-green-bg  border-hirivo-green  text-hirivo-green',
      error:   'bg-hirivo-red-bg    border-hirivo-red    text-hirivo-red',
      warning: 'bg-hirivo-amber-bg  border-hirivo-amber  text-hirivo-amber',
      info:    'bg-hirivo-teal-light border-hirivo-teal   text-hirivo-teal',
    };
    return `${base} ${map[type] ?? map['info']}`;
  }

  getIconClasses(type: string): string {
    const map: Record<string, string> = {
      success: 'text-hirivo-green',
      error:   'text-hirivo-red',
      warning: 'text-hirivo-amber',
      info:    'text-hirivo-teal',
    };
    return map[type] ?? map['info'];
  }
}