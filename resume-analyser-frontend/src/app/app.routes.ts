import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { Login } from './components/auth/login/login';
import { Signup } from './components/auth/signup/signup';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { JobDescriptionDetailComponent } from './components/job-description-detail/job-description-detail.component';
import { JobDescriptionListComponent } from './components/job-descriptions-list/job-descriptions-list.component';
import { JobFormComponent } from './components/job-form/job-form.component';
import { UserProfile } from './components/user-profile/user-profile.component';
import { TwoFactorSettingsComponent } from './components/two-factor-settings/two-factor-settings.component';
import { TwoFactorSetupComponent } from './components/two-factor-setup/two-factor-setup.component'; 
import { SwaggerDocsComponent } from './components/swagger-docs/swagger-docs.components';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminJobsComponent } from './components/admin/admin-jobs/admin-jobs.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full'
    },
    {
        path: 'welcome',
        component: WelcomeComponent,
    },
    {
        path: 'login',
        component: Login,
    },
    {
        path: 'signup',
        component: Signup,
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent,
    },
    {
        path: 'analyze',
        component: JobFormComponent,
        canActivate: [authGuard]
    },
    {
        path: 'job-descriptions',
        component: JobDescriptionListComponent,
        canActivate: [authGuard]
    },
    {
        path: 'job-descriptions/:id',
        component: JobDescriptionDetailComponent,
        canActivate: [authGuard]
    },
    {
        path: 'profile',
        component: UserProfile,
        canActivate: [authGuard]
    },
    {
        path: 'two-factor/setup',
        component: TwoFactorSetupComponent,
        canActivate: [authGuard]
    },
    {
        path: 'two-factor/settings',
        component: TwoFactorSettingsComponent,
        canActivate: [authGuard]
    },

    //Admin Routes Layout
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            {
                path: '',
                component: AdminDashboardComponent
            },
            {
                path: 'dashboard',
                redirectTo: '',
                pathMatch: 'full'
            },
            {
                path: 'users',
                component: AdminUsersComponent
            },
            {
                path: 'jobs',
                component: AdminJobsComponent
            }
        ]
    },
    {   path: 'docs', 
        component: SwaggerDocsComponent 
    },
    {
        path: '**',
        redirectTo: ''
    }
];