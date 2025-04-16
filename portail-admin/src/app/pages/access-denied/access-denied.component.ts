import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  imports: [MaterialModule],
})
export class AccessDeniedComponent {
  constructor(private readonly router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }
}
