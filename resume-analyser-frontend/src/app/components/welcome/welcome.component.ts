import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent {
  features = [
    {
      icon: '🎯',
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analyzes your resume against job descriptions for perfect matching'
    },
    {
      icon: '📊',
      title: 'Detailed Insights',
      description: 'Get comprehensive feedback on strengths, weaknesses, and improvement areas'
    },
    {
      icon: '⚡',
      title: 'Instant Results',
      description: 'Receive your analysis in seconds with actionable recommendations'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared with third parties'
    }
  ];

  // isAuthenticated$ = this.authService.isAuthenticated$;
  // isAdmin$ = this.authService.currentUser$.pipe(
  //   map(user => user?.role === 'admin')
  // );

  // constructor(private authService: AuthService) {}

  // logout(): void {
  //   this.authService.logout();
  // }
}