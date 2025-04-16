import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_MSGS } from '../../constants/error-msg.constant';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  error(userMessage: string, errorObj?: any): void {
    let finalMessage = userMessage;

    if (errorObj instanceof HttpErrorResponse) {
      const code = errorObj.status;
      let reason = '';

      switch (code) {
        case 401:
          reason = ERROR_MSGS.UNAUTHORIZED;
          break;
        case 403:
          reason = ERROR_MSGS.NOT_ALLOWED;
          break;
        case 404:
          reason = ERROR_MSGS.NOT_FOUND;
          break;
        case 500:
          reason = ERROR_MSGS.SERVER_ERROR;
          break;
        default:
          reason = ERROR_MSGS.UNEXPECTED_ERROR;
          break;
      }

      finalMessage += ` ${reason}`;
    } else if (errorObj) {
      const msg = errorObj.message || JSON.stringify(errorObj);
      finalMessage += ` - ${msg}`;
    }

    this.snackBar.open(finalMessage, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }


  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-info'],
    });
  }
}
