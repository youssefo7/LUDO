import { Component, Inject, OnInit } from '@angular/core';
import { TemplateMission } from '../../../interfaces/template.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TemplatesService } from '../../../services/logic/templates.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { WEEKS } from '../../../constants/app.constants';
import { NotificationService } from '../../../services/state/notification.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';

@Component({
  selector: 'app-edit-template-mission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
  ],
  templateUrl: './edit-template-mission-dialog.component.html',
  styleUrl: './edit-template-mission-dialog.component.scss'
})
export class EditTemplateMissionDialogComponent implements OnInit {
  mission: TemplateMission;
  selectedWeeks: { label: string; start: number; end: number }[] = [];

  showCustomOffsets = false;
  customDebut: number | null = null;
  customFin: number | null = null;
  rang = 0;

  weeks = WEEKS;

  constructor(
    private readonly dialogRef: MatDialogRef<EditTemplateMissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mission: TemplateMission },
    private readonly templatesService: TemplatesService,
    private readonly notificationService: NotificationService,
  ) { 
    this.mission = data.mission;
    this.customDebut = this.mission.OFFSET_DEBUT;
    this.customFin = this.mission.OFFSET_FIN;
    this.rang = this.mission.RANG;
   }

  ngOnInit(): void {
    if (this.mission.OFFSET_DEBUT != null && this.mission.OFFSET_FIN != null) {
      this.selectedWeeks = this.weeks.filter(week =>
        this.mission.OFFSET_DEBUT <= week.end && 
        this.mission.OFFSET_FIN >= week.start
      );
      
    }
  }

  toggleWeek(week: { label: string; start: number; end: number }): void {
    const index = this.selectedWeeks.indexOf(week);
    const weekIdx = this.weeks.indexOf(week);
  
    if (index >= 0) {
      const newSelection = [...this.selectedWeeks];
      newSelection.splice(index, 1);
  
      const sorted = newSelection
        .map(w => this.weeks.indexOf(w))
        .sort((a, b) => a - b);
  
      const isStillConsecutive = sorted.every((val, i, arr) =>
        i === 0 || val === arr[i - 1] + 1
      );
  
      if (isStillConsecutive || newSelection.length === 0) {
        this.selectedWeeks = newSelection;
      }
    } else {
      const selectedIndices = this.selectedWeeks.map(w => this.weeks.indexOf(w));
      selectedIndices.push(weekIdx);
      selectedIndices.sort((a, b) => a - b);
  
      const isConsecutive = selectedIndices.every((val, i, arr) =>
        i === 0 || val === arr[i - 1] + 1
      );
  
      if (isConsecutive) {
        this.selectedWeeks.push(week);
      } else {
        this.selectedWeeks = [week];       
      }
    }
    if(this.selectedWeeks.length !== 0) {
      this.selectedWeeks.sort((a, b) => a.start - b.start);
      this.customDebut = this.selectedWeeks[0].start;
      this.customFin = this.selectedWeeks[this.selectedWeeks.length - 1].end;
    }
  }

  toggleCustomOffsets(): void {
    this.showCustomOffsets = !this.showCustomOffsets;
  }

  save(): void {
    if (this.customDebut != null && this.customFin != null) {
      if (this.customDebut > this.customFin) {
        console.error("La date de début ne peut pas être supérieure à la date de fin.");
        return;
      }
      try {
        this.templatesService.updateTemplateMission(this.mission._id, this.customDebut, this.customFin, this.rang);
        this.notificationService.success(SUCCESS_MSGS.MISSION_UPDATE_SUCCESS);
        this.mission.OFFSET_DEBUT = this.customDebut;
        this.mission.OFFSET_FIN = this.customFin;
        this.mission.RANG = this.rang;
        this.dialogRef.close(true);
      } catch (error) {
        this.notificationService.error(ERROR_MSGS.MISSION_UPDATE_FAILED, error);
      }
    }
  }

  onDelete(): void {
    if (!this.mission._id) return;

    this.templatesService.deleteTemplateMission(this.mission._id).subscribe({
      next: () => {
        this.notificationService.success(SUCCESS_MSGS.MISSION_DELETE_SUCCESS);
        this.dialogRef.close('refresh');
      },
      error: (error) => {
        this.notificationService.error(ERROR_MSGS.MISSION_DELETE_FAILED, error);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(null);
  }

}
