import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../state/notification.service';
import { ERROR_MSGS } from '../../constants/error-msg.constant';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const errorMessage = error.error?.translation || '';

          if (errorMessage.includes('Invalid or expired token')) {
            this.authService.logout();
            this.router.navigate(['/login']);
            this.notificationService.error(ERROR_MSGS.LOGIN_TOKEN_EXPIRED);
          } else {
            this.notificationService.error(ERROR_MSGS.UNAUTHORIZED);
          }
        }
        return throwError(() => error);
      }),
    );
  }
}
