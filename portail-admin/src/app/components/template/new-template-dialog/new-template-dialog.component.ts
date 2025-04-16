import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { Template } from '../../../interfaces/template.interface';
import { TemplatesService } from '../../../services/logic/templates.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Defi } from '../../../interfaces/defi.interface';
import { DefiService } from '../../../services/logic/defi.service';
import { NotificationService } from '../../../services/state/notification.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';

@Component({
  selector: 'app-new-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
  ],
  templateUrl: './new-template-dialog.component.html',
  styleUrl: './new-template-dialog.component.scss'
})
export class NewTemplateDialogComponent implements OnInit {
  templateName = '';
  templateDescription = '';
  selectedDefiId = '';
  isSubmitting = false;

  defiList: Defi[] = [];

  constructor(
    private readonly dialogRef: MatDialogRef<NewTemplateDialogComponent>,
    private readonly templatesService: TemplatesService,
    private readonly defiService: DefiService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.defiList = this.defiService.defiList; 
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  createTemplate(): void {
    if (this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    
    const newTemplate: Partial<Template> = {
      NOM: this.templateName,
      DESCRIPTION: this.templateDescription,
    };

    this.templatesService.createTemplate(newTemplate).subscribe({
      next: () => {
        this.dialogRef.close(`refresh`);
        this.notificationService.success(SUCCESS_MSGS.TEMPLATE_CREATE_SUCCESS);
      },
      error: (err) => {
        this.notificationService.error(ERROR_MSGS.TEMPLATE_CREATE_FAILED, err);
        this.isSubmitting = false;
      }
    });
  }
}

