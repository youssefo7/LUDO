import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean> {
    const isAuth = await this.authService.isAuthenticated();
    if (!isAuth) {
      this.router.navigate(['/login']);
      return false;
    }

    const url = state.url;
    if (url.startsWith('/template-center')) {
      const isSuperAdmin = await this.authService.isSuperAdmin();
      if (!isSuperAdmin) {
        this.router.navigate(['/access-denied']);
        return false;
      }
    }

    const defiId = route.paramMap.get('id');
    if (defiId) {
      const canAccessDefi = await this.authService.canAccessDefi(defiId);
      if (!canAccessDefi) {
        this.router.navigate(['/access-denied']);
        return false;
      }
    }

    return true;
  }
}
