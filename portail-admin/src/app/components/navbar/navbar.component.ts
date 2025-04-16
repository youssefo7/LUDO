import { AuthService } from './../../services/api/auth.service';
import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DefiService } from '../../services/logic/defi.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  imports: [MaterialModule, RouterModule, CommonModule],
})
export class NavbarComponent implements OnDestroy {
  pageTitle = '';
  private routerSubscription!: Subscription;

  constructor(
    private readonly router: Router,
    protected defiService: DefiService,
    private authService: AuthService,
  ) {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updatePageTitle(event.urlAfterRedirects);
      }
    });
  }

  updatePageTitle(url: string) {
    if (url.includes('/defi-stats')) {
      const parts = url.split('/');
      const statsIndex = parts.indexOf('defi-stats');

      this.pageTitle =
        statsIndex < parts.length - 1
          ? 'Statistiques de Défi'
          : 'Statistiques Globales';
      return;
    }

    const routeMap: Record<string, string> = {
      '/control-center': 'Centre de Controle Défi',
      '/template-center': 'Centre de Controle Template',
    };

    for (const key in routeMap) {
      if (url.includes(key)) {
        this.pageTitle = routeMap[key];
        return;
      }
    }

    this.pageTitle = 'Portail Administratif';
  }

  showNotifications() {
    alert('Show notifications');
  }

  signOut() {
    this.authService.logout();
    this.router.navigateByUrl(`/login`);
  }
  onLogoClick() {
    this.router.navigateByUrl(`/`);
  }

  isOnPage(page: string): boolean {
    return this.router.url.includes(page);
  }

  openAccountSettings() {
    alert('Open account settings');
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe(); // Unsubscribe to avoid memory leaks
    }
  }
}
