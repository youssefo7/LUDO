import { NotificationService } from './../../../services/state/notification.service';
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { FR_DATE_LANG } from '../../../constants/app.constants';
import { Router } from '@angular/router';
import { DefiService } from '../../../services/logic/defi.service';
import { AuthService } from '../../../services/api/auth.service';

@Component({
  selector: 'app-defi-info-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './defi-info-dialog.component.html',
  styleUrls: ['./defi-info-dialog.component.scss'],
})
export class DefiInfoDialogComponent implements OnInit {
  copiedCode = false;
  copiedLink = false;
  editMode = false;

  editableDefi = {
    defiName: '',
  };

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  datePipe: DatePipe;
  public isSuperAdmin = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      defiCode: string;
      defiId: string;
      defiName: string;
      defiStartDate: Date;
      defiEndDate: Date;
    },
    private readonly dialogRef: MatDialogRef<DefiInfoDialogComponent>,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly defiService: DefiService,
    public authService: AuthService,
  ) {
    this.datePipe = new DatePipe(FR_DATE_LANG);
  }

  ngOnInit(): void {
    this.authService.isSuperAdmin().then((isSuperAdmin) => {
      this.isSuperAdmin = isSuperAdmin;
      this.editableDefi.defiName = this.data.defiName;
      this.range.controls.start.setValue(new Date(this.data.defiStartDate));
      this.range.controls.end.setValue(new Date(this.data.defiEndDate));
    });
  }

  formattedDate(value: Date | null): string {
    return value !== null
      ? (this.datePipe.transform(value, 'EEEE d MMM HH:mm') ?? 'Date invalide')
      : 'Date vide';
  }

  copyToClipboard(text: string, type: 'code' | 'link' = 'code') {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (type === 'code') {
          this.copiedCode = true;
          setTimeout(() => (this.copiedCode = false), 2000);
        } else if (type === 'link') {
          this.copiedLink = true;
          setTimeout(() => (this.copiedLink = false), 2000);
        }
      })
      .catch((err) => {
        this.notificationService.error(ERROR_MSGS.COPY_FAILED, err);
      });
  }

  onSave(): void {
    if (this.range.valid && this.editableDefi.defiName.trim() !== '') {
      const defiId = this.data.defiId;
      const defiName = this.editableDefi.defiName.trimEnd();
      const startDate = this.range.controls.start.value!;
      const endDate = this.range.controls.end.value!;

      const normalizedStartDate = new Date(startDate.setHours(0, 0, 0, 0));
      const normalizedEndDate = new Date(endDate.setHours(0, 0, 0, 0));
      const normalizedDataStartDate = new Date(
        this.data.defiStartDate.setHours(0, 0, 0, 0),
      );
      const normalizedDataEndDate = new Date(
        this.data.defiEndDate.setHours(0, 0, 0, 0),
      );

      if (
        defiName !== this.data.defiName ||
        normalizedStartDate.getTime() !== normalizedDataStartDate.getTime() ||
        normalizedEndDate.getTime() !== normalizedDataEndDate.getTime()
      ) {
        this.defiService
          .updateDefi(defiId, defiName, startDate, endDate)
          .subscribe({
            next: () => {
              this.dialogRef.close('refresh');
              this.notificationService.success('Défi mis à jour avec succès!');
            },
            error: (err) => {
              this.notificationService.error(
                ERROR_MSGS.DEFI_UPDATE_FAILED,
                err,
              );
            },
          });
      } else {
        this.notificationService.info('Aucune modification détectée.');
      }
    } else {
      this.notificationService.error(ERROR_MSGS.FORM_VALIDATION_FAILED);
    }
  }

  onDelete(): void {
    if (!this.data.defiId) {
      return;
    }
    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer ce défi ?',
    );
    if (confirmed) {
      this.defiService.deleteDefi(this.data.defiId).subscribe({
        next: () => {
          this.router.navigate(['/selection-defis']);
          this.dialogRef.close();
          this.notificationService.success('Défi supprimé avec succès!');
        },
        error: (err: Error) =>
          this.notificationService.error(ERROR_MSGS.DEFI_DELETE_FAILED, err),
      });
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
