import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

import { ProgressComponent } from './pages/progress/progress.component';
import { UpdatePasswordComponent } from './pages/update-password/update-password.component';
import { AdminReportsComponent } from './pages/admin-reports/admin-reports.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [authGuard] },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'progress', component: ProgressComponent, canActivate: [authGuard] },
    { path: 'update-password', component: UpdatePasswordComponent, canActivate: [authGuard] },
    { path: 'admin/reports', component: AdminReportsComponent, canActivate: [authGuard, adminGuard] },
];
