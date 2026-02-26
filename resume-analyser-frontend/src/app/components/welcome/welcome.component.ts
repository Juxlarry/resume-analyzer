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
      title: 'Role-Match Scoring',
      description: 'Understand how closely your resume aligns with the role before you apply.'
    },
    {
      title: 'Actionable Improvements',
      description: 'Get precise guidance on what to improve, not generic writing tips.'
    },
    {
      title: 'Rewrite + Export',
      description: 'Generate a polished rewrite and download as PDF or LaTeX.'
    },
    {
      title: 'Secure by Design',
      description: 'Your files stay private with authenticated endpoints and ownership checks.'
    }
  ];

  steps = [
    {
      number: '01',
      title: 'Upload Resume',
      description: 'Start with your current resume in PDF or DOCX.'
    },
    {
      number: '02',
      title: 'Paste Job Description',
      description: 'Provide the role requirements you are targeting.'
    },
    {
      number: '03',
      title: 'Review Suggestions',
      description: 'Select improvements, keywords, and project additions.'
    },
    {
      number: '04',
      title: 'Generate & Download',
      description: 'Produce a rewritten resume and download PDF instantly.'
    }
  ];

  faqs = [
    {
      question: 'Can I rerun analysis for a different role?',
      answer: 'Yes. You can reuse your existing resume and run a new analysis for each job description.'
    },
    {
      question: 'Do you support both resume parsing and rewrite?',
      answer: 'Yes. The platform analyzes your current resume and can generate a rewritten version with selected improvements.'
    },
    {
      question: 'Will this guarantee interviews?',
      answer: 'No tool can guarantee outcomes, but stronger alignment and clearer impact language usually improves response rates.'
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
