import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateDefiDialogComponent } from '../create-defi-dialog/create-defi-dialog.component';
import { DefiService } from '../../../services/logic/defi.service';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';

@Component({
  selector: 'app-create-entreprise-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule],
  templateUrl: './create-entreprise-dialog.component.html',
  styleUrl: './create-entreprise-dialog.component.scss',
})
export class CreateEntrepriseDialogComponent implements OnInit {
  entrepriseForm!: FormGroup;
  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CreateDefiDialogComponent>,
    private readonly defiService: DefiService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.entrepriseForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.entrepriseForm.valid) {
      try {
        this.defiService.createEntreprise(this.entrepriseForm.value.name);
        this.dialogRef.close();
        this.notificationService.success(SUCCESS_MSGS.ENTREPRISE_CREATE_SUCCESS);
      } catch (err) {
        this.notificationService.error(ERROR_MSGS.ENTREPRISE_CREATE_FAILED, err);
      }
    }
  }
  
  
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
