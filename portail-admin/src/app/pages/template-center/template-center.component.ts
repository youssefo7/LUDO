import { Component, OnInit } from '@angular/core';
import { TemplatesService } from '../../services/logic/templates.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Template,
  TemplateMission,
  TemplateAnnonce,
} from '../../interfaces/template.interface';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { FormsModule } from '@angular/forms';
import { TemplateMissionListComponent } from '../../components/template/template-mission-list/template-mission-list.component';
import { TemplateAnnouncementsListComponent } from '../../components/template/template-announcements-list/template-announcements-list.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../services/state/notification.service';
import { ERROR_MSGS } from '../../constants/error-msg.constant';
import { formatDate } from '../../utils/date-utils';

@Component({
  selector: 'app-template-center',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    TemplateMissionListComponent,
    TemplateAnnouncementsListComponent,
  ],
  templateUrl: './template-center.component.html',
  styleUrl: './template-center.component.scss',
})
export class TemplateCenterComponent implements OnInit {
  templateId!: string;
  template!: Template;
  missions: TemplateMission[] = [];
  annonces: TemplateAnnonce[] = [];
  isPopupOpen = false;
  templateCode = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly templatesService: TemplatesService,
    private readonly dialog: MatDialog,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  loadTemplate(): void {
    this.templatesService.getTemplatesbyId(this.templateId).subscribe({
      next: (data) => {
        this.template = data;
      },
      error: (err) => {
        this.notificationService.error(ERROR_MSGS.TEMPLATE_FETCH_FAILED, err);
      },
    });
  }

  openDeleteTemplateDialog(): void {
    if (!this.template) {
      return;
    }
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ce template ?`,
    );
    if (confirmed) {
      this.templatesService.deleteTemplate(this.template._id).subscribe({
        next: () => {
          this.router.navigate(['/selection-defis'], {
            state: { tab: 'template' },
          });
        },
        error: (err: Error) => {
          this.notificationService.error(
            ERROR_MSGS.TEMPLATE_DELETE_FAILED,
            err,
          );
        },
      });
    }
  }
  protected formattedDate(date: Date | string | undefined): string {
    return formatDate(date);
  }
}
