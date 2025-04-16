import { Component, Input, OnInit } from '@angular/core';
import {
  TemplateAnnonce,
} from '../../../interfaces/template.interface';
import { TemplatesService } from '../../../services/logic/templates.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { NewTemplateAnnoucementDialogComponent } from '../new-template-annoucement-dialog/new-template-annoucement-dialog.component';
import { Subscription } from 'rxjs';
import { TemplateAnnonceDetailsDialogComponent } from '../template-annonce-details-dialog/template-annonce-details-dialog.component';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';

@Component({
  selector: 'app-template-announcements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './template-announcements-list.component.html',
  styleUrl: './template-announcements-list.component.scss',
})
export class TemplateAnnouncementsListComponent implements OnInit {
  @Input() templateId!: string;

  annonces: TemplateAnnonce[] = [];
  sub!: Subscription;
  showKanbanView = false;

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly dialog: MatDialog,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadTemplateAnnonces();
  }

  async loadTemplateAnnonces() {
    if (!this.templateId) return;

    try {
      this.annonces = await this.templatesService.getTemplateAnnonces(this.templateId);
      this.convertFromUtc();
      this.annonces.sort((a, b) => a.JOUR - b.JOUR);
    } catch (error) {
      this.notificationService.error(ERROR_MSGS.ANNONCE_FETCH_FAILED, error);
      this.annonces = [];
    }
  }

  openNewTemplateAnnonceDialog(): void {
    const dialogRef = this.dialog.open(NewTemplateAnnoucementDialogComponent, {
      width: '40%',
      height: '60%',
      data: this.templateId,
    });

    dialogRef.afterClosed().subscribe((result: TemplateAnnonce) => {
      if (result) {
        // Time zone conversion to UTC
        const localDate = new Date();
        const utcOffset = localDate.getTimezoneOffset() / 60;
        result.HEURE = (result.HEURE + utcOffset + 24) % 24;
        this.newTemplateAnnonce(result);
      }
    });
  }

  async newTemplateAnnonce(annonce: TemplateAnnonce) {
    try {
      this.annonces = await this.templatesService.createTemplateAnnonce(annonce);
      this.convertFromUtc();
      this.annonces.sort((a, b) => a.JOUR - b.JOUR);
      this.notificationService.success(SUCCESS_MSGS.ANNONCE_CREATE_SUCCESS);
    } catch (error) {
      this.notificationService.error(ERROR_MSGS.ANNONCE_CREATE_FAILED, error);
    }
  }

  openTemplateAnnonceDetailsDialog(templateAnnonce: TemplateAnnonce): void {
    const dialogRef = this.dialog.open(TemplateAnnonceDetailsDialogComponent, {
      width: '40%',
      height: '60%',
      data: templateAnnonce,
    });

    dialogRef.afterClosed().subscribe(async (result: { action: string, templateAnnonce: TemplateAnnonce }) => {
      if (result && result.action === 'update') {     
        try {
          // Time zone conversion to UTC
          const localDate = new Date();
          const utcOffset = localDate.getTimezoneOffset() / 60;
          result.templateAnnonce.HEURE = (result.templateAnnonce.HEURE + utcOffset + 24) % 24;
          this.annonces = await this.templatesService.updateTemplatesAnnonce(result.templateAnnonce);
          this.convertFromUtc();
          this.annonces.sort((a, b) => a.JOUR - b.JOUR);
          this.notificationService.success(SUCCESS_MSGS.TEMPLATE_UPDATE_SUCCESS);
        } catch(error) {
          this.notificationService.error(ERROR_MSGS.TEMPLATE_UPDATE_FAILED, error);
        }
      } else if (result && result.action === 'delete') {
        try {
          this.annonces = await this.templatesService.deleteTemplatesAnnonce(result.templateAnnonce);
          this.notificationService.success(SUCCESS_MSGS.ANNONCE_DELETE_SUCCESS);
        } catch(error) {
          this.notificationService.error(ERROR_MSGS.ANNONCE_DELETE_FAILED, error);
        }
      }
    });
  }

  private convertFromUtc() {
    const localDate = new Date();
    const utcOffset = localDate.getTimezoneOffset() / 60;
    this.annonces = this.annonces.map((item) => {
      item.HEURE = (item.HEURE - utcOffset + 24) % 24;
      return item;
    });
  }
}
