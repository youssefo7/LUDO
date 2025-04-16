import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TemplateAnnonce } from '../../../interfaces/template.interface';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { DEFAULT_TIME } from '../../../constants/app.constants';

export interface TemplateAnnonceDialogData {
  templateAnnonce: TemplateAnnonce;
}

@Component({
  selector: 'app-template-annonce-details-dialog',
  imports: [
    MaterialModule,
    CommonModule,
    FormsModule

  ],
  templateUrl: './template-annonce-details-dialog.component.html',
  styleUrl: './template-annonce-details-dialog.component.scss'
})
export class TemplateAnnonceDetailsDialogComponent {
  templateAnnonce: TemplateAnnonce;
  protected selectedTime: string = DEFAULT_TIME;

  constructor(
    public dialogRef: MatDialogRef<TemplateAnnonceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateAnnonce
  ) {
    this.selectedTime = `${data.HEURE.toString().padStart(2, '0')}:${data.MIN.toString().padStart(2, '0')}`;
    this.templateAnnonce = data;
  }

  onUpdate(): void {
    this.data.HEURE = parseInt(this.selectedTime.split(':')[0], 10);
    this.data.MIN = parseInt(this.selectedTime.split(':')[1], 10);
    this.dialogRef.close({ action: 'update', templateAnnonce: this.templateAnnonce });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', templateAnnonce: this.templateAnnonce });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
