import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: string; 
  type: 'success' | 'error' | 'warning' | 'info';
  message: string; 
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertSubject = new BehaviorSubject<Alert[]>([]); 
  public alerts$ = this.alertSubject.asObservable(); 

  success(message: string, duration: number = 5000): void{
    this.addAlert('success', message, duration);
  }

  error(message: string, duration: number = 7000): void{
    this.addAlert('error', message, duration);
  }

  warning(message: string, duration: number = 6000): void{
    this.addAlert('warning', message, duration);
  }

  info(message: string, duration: number = 5000): void{
    this.addAlert('info', message, duration);
  }


  private addAlert(type: Alert['type'], message: string, duration: number): void {
    const id = this.generateId();
    const alert: Alert = {id, type, message, duration}

    const currentAlerts = this.alertSubject.value; 
    this.alertSubject.next([...currentAlerts, alert]);

    if(duration > 0){
      setTimeout(()=> this.removeAlert(id), duration);
    }
  }

  removeAlert(id: string): void{
    const currentAlerts = this.alertSubject.value; 

    this.alertSubject.next(currentAlerts.filter(alert => alert.id !== id ));
  }

  clearAll(): void {
    this.alertSubject.next([]);
  }


  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
  }
}
