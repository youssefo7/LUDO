import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { MatDialogRef } from '@angular/material/dialog';
import { TemplateAnnonce } from '../../../interfaces/template.interface';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DEFAULT_TIME } from '../../../constants/app.constants';


@Component({
  selector: 'app-new-template-annoucement-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule
  ],
  templateUrl: './new-template-annoucement-dialog.component.html',
  styleUrl: './new-template-annoucement-dialog.component.scss'
})
export class NewTemplateAnnoucementDialogComponent {
  protected annonce : TemplateAnnonce;
  protected selectedTime: string = DEFAULT_TIME;

  constructor(
    public dialogRef: MatDialogRef<NewTemplateAnnoucementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public templateId: string,
  ) {
    this.annonce = {
      JOUR: 0,
      FR_TITRE: '',
      FR_SOUS_TITRE: '',
      EN_SOUS_TITRE: '',
      EN_TITRE: '',
      UTM_TAG: '',
      HEURE: 12,
      MIN: 0,
      TEMPLATE: this.templateId
    } as TemplateAnnonce;
  }

  onCreate(): void {
    this.annonce.HEURE = parseInt(this.selectedTime.split(':')[0], 10);
    this.annonce.MIN = parseInt(this.selectedTime.split(':')[1], 10);
    this.dialogRef.close(this.annonce);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

}
