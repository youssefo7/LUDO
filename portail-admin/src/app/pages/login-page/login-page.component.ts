import { NotificationService } from './../../services/state/notification.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/api/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ERROR_MSGS } from '../../constants/error-msg.constant';
import { SUCCESS_MSGS } from '../../constants/succes-msg.constant';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
  ) {}

  onLogin() {
    this.errorMessage = '';
    
    if (!this.email || !this.password) {
      this.errorMessage = ERROR_MSGS.LOGIN_FAILED_INVALID;
      return;
    }
    
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigateByUrl('/');
          this.notificationService.success(SUCCESS_MSGS.LOGIN_SUCCESS);
        } else {
          this.errorMessage = ERROR_MSGS.LOGIN_FAILED_INVALID;
        }
      },
      error: () => {
        this.errorMessage = ERROR_MSGS.LOGIN_FAILED_UNKNOWN;
      }
    });
  }
}