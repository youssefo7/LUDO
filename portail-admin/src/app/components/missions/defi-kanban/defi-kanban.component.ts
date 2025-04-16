import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionDetailsDialogComponent } from '../mission-details-dialog/mission-details-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../../material.module';
import { DefiMission } from '../../../interfaces/missions.interface';
import { formatDateRange, formatDateRangeWithoutYear } from '../../../utils/date-utils';
import { DefiSelectorComponent } from '../../defi-selector/defi-selector.component';
import { MissionService } from '../../../services/logic/mission.service';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { ONE_WEEK } from '../../../constants/app.constants';

interface Week {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  missions: DefiMission[];
  sectionType?: 'pre-defi' | 'post-defi' | 'defi';
}

@Component({
  selector: 'app-defi-kanban',
  standalone: true,
  templateUrl: './defi-kanban.component.html',
  styleUrls: ['./defi-kanban.component.scss'],
  imports: [CommonModule, MaterialModule, DefiSelectorComponent],
})
export class DefiKanbanComponent implements OnChanges {
  @Input() defiStartDate!: Date;
  @Input() defiEndDate!: Date;
  @Input() missions: DefiMission[] = [];
  @Output() closeKanban = new EventEmitter<void>();

  weeks: Week[] = [];
  displayedWeeks: Week[] = [];
  WEEKS_TO_DISPLAY = 6;
  currentWeekIndex = 0;

  constructor(
    private readonly dialog: MatDialog,
    private readonly missionService: MissionService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['defiStartDate'] ||
      changes['defiEndDate'] ||
      changes['missions']
    ) {
      this.calculateWeeks();
    }
  }

  private calculateWeeks(): void {
    this.weeks = [];
    if (!this.defiStartDate || !this.defiEndDate) return;

    const start = new Date(this.defiStartDate);
    const end = new Date(this.defiEndDate);
    
    const preDefiStart = new Date(this.defiStartDate.getTime() - 8 * ONE_WEEK); //  8 weeks before the start date
    preDefiStart.setDate(preDefiStart.getDate());
    const preDefiEnd = new Date(start);
    preDefiEnd.setDate(preDefiEnd.getDate() - 1);
    
    const preDefiMissions = this.missionService.defiMissions.filter((mission) => {
      const missionStart = new Date(mission.DATE_DEBUT);
      const missionEnd = new Date(mission.DATE_FIN);
      return missionStart <= preDefiEnd && missionEnd >= preDefiStart;
    });
    
    this.weeks.push({
      weekNumber: 0,
      startDate: preDefiStart,
      endDate: preDefiEnd,
      missions: preDefiMissions,
      sectionType: 'pre-defi'
    });

    let weekNumber = 1;
    let currentStart = new Date(start);

    while (currentStart <= end) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + 6);

      if (currentEnd > end) {
        currentEnd.setTime(end.getTime());
      }

      const weekMissions = this.missionService.defiMissions.filter((mission) => {
        const missionStart = new Date(mission.DATE_DEBUT);
        const missionEnd = new Date(mission.DATE_FIN);
        return missionStart <= currentEnd && missionEnd >= currentStart;
      });

      this.weeks.push({
        weekNumber,
        startDate: new Date(currentStart),
        endDate: new Date(currentEnd),
        missions: weekMissions,
        sectionType: 'defi'
      });

      weekNumber++;
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    
    const postDefiStart = new Date(end);
    postDefiStart.setDate(postDefiStart.getDate() + 1);
    const postDefiEnd = new Date(end);
    postDefiEnd.setDate(postDefiEnd.getDate() + 14);
    
    const postDefiMissions = this.missionService.defiMissions.filter((mission) => {
      const missionStart = new Date(mission.DATE_DEBUT);
      const missionEnd = new Date(mission.DATE_FIN);
      return missionStart <= postDefiEnd && missionEnd >= postDefiStart;
    });
    
    this.weeks.push({
      weekNumber: weekNumber,
      startDate: postDefiStart,
      endDate: postDefiEnd,
      missions: postDefiMissions,
      sectionType: 'post-defi'
    });

    this.currentWeekIndex = 0;
    this.updateDisplayedWeeks();
  }

  updateDisplayedWeeks(): void {
    this.displayedWeeks = this.weeks.slice(
      this.currentWeekIndex,
      this.currentWeekIndex + this.WEEKS_TO_DISPLAY,
    );
  }

  previousWeeks(): void {
    if (this.currentWeekIndex > 0) {
      this.currentWeekIndex--;
      this.updateDisplayedWeeks();
    }
  }

  nextWeeks(): void {
    if (this.currentWeekIndex + this.WEEKS_TO_DISPLAY < this.weeks.length) {
      this.currentWeekIndex++;
      this.updateDisplayedWeeks();
    }
  }

  openMissionDetails(mission: DefiMission): void {
    const dialogRef = this.dialog.open(MissionDetailsDialogComponent, {
      data: mission,
      width: '40%',
      maxHeight: '80%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const { action, mission: updatedMission } = result;

      if (action === 'save') {
        this.missionService.updateMission(
          updatedMission._id,
          updatedMission.DATE_DEBUT,
          updatedMission.DATE_FIN,
          updatedMission.rang || 4
        ).then(() => {
          this.notificationService.success(SUCCESS_MSGS.MISSION_UPDATE_SUCCESS);
          const index = this.missionService.defiMissions.findIndex(m => m._id === updatedMission._id);
          if (index !== -1) {
            this.missionService.defiMissions[index] = updatedMission;
            this.calculateWeeks(); 
          }
        }).catch((error: Error) => {
          this.notificationService.error(ERROR_MSGS.MISSION_UPDATE_FAILED, error);
        });
      } else if (action === 'delete') {
        const confirmed = window.confirm('Voulez-vous vraiment supprimer cette mission ?');
        if (confirmed) {
          this.missionService.deleteMission(updatedMission._id).subscribe({
            next: () => {
              this.notificationService.success(SUCCESS_MSGS.MISSION_DELETE_SUCCESS);
              this.missionService.defiMissions = this.missionService.defiMissions.filter(m => m._id !== updatedMission._id);
              this.calculateWeeks(); 
            },
            error: (error: Error) => {
              this.notificationService.error(ERROR_MSGS.MISSION_DELETE_FAILED, error);
            }
          });
        }
      }
    });
  }

  protected formattedDateRange(
    start: Date | undefined,
    end: Date | undefined,
  ): string {
    return formatDateRange(start, end);
  }

  protected formattedDateRangeWithoutYear(
    start: Date | undefined,
    end: Date | undefined,
  ): string {
    return formatDateRangeWithoutYear(start, end);
  }
  
  closeDialog(): void {
    this.closeKanban.emit();
  }
}
