import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
// import { adminGuard } from './guards/admin-guard.__t_s';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full'
    },
    {
        path: 'welcome',
        loadComponent: () => import('./components/welcome/welcome.component').then(m => m.WelcomeComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login').then(m => m.Login)
    },
    {
        path: 'signup',
        loadComponent: () => import('./components/auth/signup/signup').then(m => m.Signup)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./components/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: 'analyze',
        loadComponent: () => import('./components/job-form/job-form.component').then(m => m.JobFormComponent),
        canActivate: [authGuard]
    },
    {
        path: 'job-descriptions',
        loadComponent: () => import('./components/job-descriptions-list/job-descriptions-list.component').then(m => m.JobDescriptionListComponent),
        canActivate: [authGuard]
    },
    {
        path: 'job-descriptions/:id',
        loadComponent: () => import('./components/job-description-detail/job-description-detail.component').then(m => m.JobDescriptionDetailComponent),
        canActivate: [authGuard]
    },
    {
        path: 'profile',
        loadComponent: () => import('./components/user-profile/user-profile.component').then(m => m.UserProfile),
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [authGuard] // Will add admin guard later
    },
    {
        path: '**',
        redirectTo: ''
    }
];