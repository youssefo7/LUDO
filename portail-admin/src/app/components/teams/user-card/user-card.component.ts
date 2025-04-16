import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss'],
})
export class UserCardComponent {
  @Input() user!: User;
  @Input() userName!: string;
  @Input() buttonType: 'add' | 'remove' | 'none' = 'none';
  @Input() disabled = false;
  @Output() buttonClick = new EventEmitter<User>();
  @Output() cardClick = new EventEmitter<User>();

  onButtonClick(event: Event): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.buttonClick.emit(this.user);
    }
  }

  onCardClick(): void {
    this.cardClick.emit(this.user);
  }
}
