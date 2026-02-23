import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({ 
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
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

  isAuthenticated$: Observable<boolean>;

  isLoggedIn = false;
  userEmail: string | null = null;
  currentUserRole: string = 'user';
  isAdmin = false;
  isModerator = false;
  isDropdownOpen = false;

  constructor( 
    private authService: AuthService,
    private router: Router
  ){
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  navigateToAnalyze(): void {
    this.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/analyze']);
      } else {
        this.router.navigate(['/login']);
      }
    }).unsubscribe();
  }
}
