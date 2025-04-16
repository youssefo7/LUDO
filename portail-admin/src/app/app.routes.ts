import { Routes } from '@angular/router';
import { ControlCenterComponent } from './pages/control-center/control-center.component';
import { DefiStatsComponent } from './pages/defi-stats/defi-stats.component';
import { SelectionDefiComponent } from './pages/selection-defis/selection-defis.component';
import { TemplateCenterComponent } from './pages/template-center/template-center.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { AuthGuard } from './services/api/auth.guard';

export const routes: Routes = [
  { path: '', component: SelectionDefiComponent, canActivate: [AuthGuard] },
  { path: 'control-center/:id', component: ControlCenterComponent, canActivate: [AuthGuard] },
  { path: 'selection', component: SelectionDefiComponent, canActivate: [AuthGuard] },
  { path: 'defi-stats', component: DefiStatsComponent, canActivate: [AuthGuard] },
  { path: 'defi-stats/:id', component: DefiStatsComponent, canActivate: [AuthGuard] },
  { path: 'template-center/:id', component: TemplateCenterComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '**', redirectTo: '' },
];
