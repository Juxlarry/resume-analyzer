import { Routes } from '@angular/router';
import { WelcomeComponent } from './components/welcome/welcome.component';

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
    // {
    //     path: 'welcome',
    //     component: WelcomeComponent
    // },
    {
        path: 'analyze',
        loadComponent: () => import('./components/job-form/job-form.component').then(m => m.JobFormComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), 
        // Later you can add auth guard here
        // canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: '/welcome'
    }
];