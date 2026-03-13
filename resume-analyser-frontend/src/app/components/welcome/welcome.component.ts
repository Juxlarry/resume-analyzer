import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

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
      title: 'ATS Match Scoring',
      description: 'Know exactly how your resume scores against automated screening systems before you apply.'
    },
    {
      title: 'Keyword Gap Analysis',
      description: 'See which skills and terms are missing from your resume compared to the target role.'
    },
    {
      title: 'AI-Powered Rewrite',
      description: 'Generate an optimised resume with missing keywords added naturally and ATS-hostile formatting removed.'
    },
    {
      title: 'Secure by Design',
      description: 'Your resume is processed in real time and immediately discarded. Nothing is stored on our servers.'
    }
  ];

  steps = [
    {
      number: '01',
      title: 'Upload Your Resume',
      description: 'Submit your current resume as a PDF or DOCX file. Plain text paste is also supported.'
    },
    {
      number: '02',
      title: 'Add the Job Description',
      description: 'Paste the job description text, or upload it as a PDF or DOCX. Hirivo handles the rest.'
    },
    {
      number: '03',
      title: 'Review Your ATS Report',
      description: 'Get your match score, keyword gaps, format issues, and a prioritised list of quick wins.'
    },
    {
      number: '04',
      title: 'Download Optimised Resume',
      description: 'Generate your ATS-optimised rewrite and download it as PDF or DOCX — ready to submit.'
    }
  ];

  faqs = [
    {
      question: 'Can I analyse my resume against multiple job descriptions?',
      answer: 'Yes. You can run a new analysis for each role you are targeting. Your results are saved in your account history so you can track and compare across applications.'
    },
    {
      question: 'Is my resume data stored or shared?',
      answer: 'No. Hirivo processes your resume in real time using OpenAI GPT-4o and discards it immediately after your results are generated. We never store, share, or sell your documents or personal data.'
    },
    {
      question: 'Which ATS systems does Hirivo optimise for?',
      answer: 'Hirivo is designed to improve compatibility with Workday, Greenhouse, Taleo, Lever, iCIMS, and SAP SuccessFactors — the systems used by the majority of companies that screen resumes automatically.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'Hirivo supports PDF and DOCX uploads for both resumes and job descriptions. You can also paste job description text directly into the input field.'
    },
    {
      question: 'Will this guarantee I get interviews?',
      answer: 'No tool can guarantee outcomes. What Hirivo does is give your resume the best possible chance of passing automated screening — so your application reaches a human recruiter in the first place.'
    }
  ];

  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
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