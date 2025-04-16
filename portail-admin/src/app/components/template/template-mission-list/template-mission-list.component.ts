import { Component, Input, OnInit } from '@angular/core';
import { TemplatesService } from '../../../services/logic/templates.service';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { NewTemplateMissionDialogComponent } from '../new-template-mission-dialog/new-template-mission-dialog.component';
import { EditTemplateMissionDialogComponent } from '../edit-template-mission-dialog/edit-template-mission-dialog.component';
import { TemplateMission } from '../../../interfaces/template.interface';
import { WEEKS } from '../../../constants/app.constants';

@Component({
  selector: 'app-template-mission-list',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './template-mission-list.component.html',
  styleUrl: './template-mission-list.component.scss',
})
export class TemplateMissionListComponent implements OnInit {
  @Input() templateId!: string;

  templateStartDate!: Date;
  templateEndDate!: Date;

  constructor(
    private readonly templatesService: TemplatesService,
    private readonly dialog: MatDialog,
    protected readonly templateService: TemplatesService,
  ) {}

  ngOnInit(): void {
    this.initializeTemplateDates();
    this.loadMissions();
  }

  private initializeTemplateDates(): void {
    this.templateStartDate = this.templatesService.range.controls.start
      .value as Date;
    this.templateEndDate = this.templatesService.range.controls.end
      .value as Date;
  }

  private async loadMissions() {
    if (!this.templateId) return;

    await this.templatesService.getTemplateMissionsById(this.templateId);
  }

  openNewMissionDialog(): void {
    const dialogRef = this.dialog.open(NewTemplateMissionDialogComponent, {
      width: '75%',
      data: {
        templateId: this.templateId,
        templateStartDate: this.templateStartDate,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMissions();
      }
    });
  }

  openEditTemplateMissionDialog(mission: TemplateMission): void {
    const dialogRef = this.dialog.open(EditTemplateMissionDialogComponent, {
      width: '75%',
      data: { mission: mission },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        this.loadMissions();
      }
    });
  }

  getWeeksForMission(mission: TemplateMission) {
    if (mission.OFFSET_DEBUT == null || mission.OFFSET_FIN == null) {
      return [];
    }

    return WEEKS.filter(week =>
      mission.OFFSET_DEBUT <= week.end &&
      mission.OFFSET_FIN >= week.start
    );
  }
}
