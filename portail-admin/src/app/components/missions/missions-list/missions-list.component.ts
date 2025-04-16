import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { DefiMission } from '../../../interfaces/missions.interface';
import { MissionService } from '../../../services/logic/mission.service';
import { DefiKanbanComponent } from '../defi-kanban/defi-kanban.component';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { MatDialog } from '@angular/material/dialog';
import { AddMissionDialogComponent } from '../add-mission-dialog/add-mission-dialog.component';
import { MissionDetailsDialogComponent } from '../mission-details-dialog/mission-details-dialog.component';
import { AuthService } from '../../../services/api/auth.service';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { formatDateRange } from '../../../utils/date-utils';

@Component({
  selector: 'app-missions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, DefiKanbanComponent],
  templateUrl: './missions-list.component.html',
  styleUrls: ['./missions-list.component.scss'],
})
export class MissionsListComponent implements OnInit, OnDestroy {
  defiId = '';
  selectedMission: DefiMission | null = null;
  private defiSubscription!: Subscription;
  showDeleteConfirmation = false;
  missionToDelete: DefiMission | null = null;

  showNewMissionPopup = false;
  selectedMissionClassiqueId = '';
  newMissionStartDate: Date | null = null;
  newMissionEndDate: Date | null = null;

  defiStartDate!: Date;
  defiEndDate!: Date;

  showKanbanView = false;
  isSuperAdmin = false;

  constructor(
    protected readonly missionService: MissionService,
    private readonly stateService: DefiStateService,
    private readonly dialog: MatDialog,
    public authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.authService.isSuperAdmin().then((isSuperAdmin) => {
      this.isSuperAdmin = isSuperAdmin;
      this.defiSubscription = this.stateService.defi$.subscribe((defi) => {
        if (defi) {
          this.defiId = defi._id;
          this.defiStartDate = defi.DATE_DEBUT;
          this.defiEndDate = defi.DATE_FIN;
          this.fetchAllData().catch((err) =>
            console.error('Error fetching data:', err),
          );
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.defiSubscription?.unsubscribe();
  }

  private async fetchAllData() {
    const defiId = this.defiId;
    if (!defiId) {
      console.error('Defi ID is undefined');
      return;
    }

    this.defiStartDate = this.defiStartDate ?? new Date();
    this.defiEndDate = this.defiEndDate ?? new Date();
    await this.missionService.getMissionsByDefiId(
      defiId,
      this.defiStartDate,
      this.defiEndDate,
    );
  }

  closeNewMissionPopup(): void {
    this.showNewMissionPopup = false;
    this.resetNewMissionFields();
  }

  private resetNewMissionFields(): void {
    this.selectedMissionClassiqueId = '';
    this.newMissionStartDate = null;
    this.newMissionEndDate = null;
  }

  async saveMission(mission: DefiMission): Promise<void> {
    if (!mission?._id) return;

    try {
      const updatedMission = await this.missionService.updateMission(
        mission._id,
        mission.DATE_DEBUT,
        mission.DATE_FIN,
        mission.RANG,
      );
      const index = this.missionService.defiMissions.findIndex(
        (m) => m._id === mission._id,
      );
      if (index !== -1) {
        this.missionService.defiMissions[index] = {
          ...this.missionService.defiMissions[index],
          DATE_DEBUT: new Date(updatedMission.DATE_DEBUT),
          DATE_FIN: new Date(updatedMission.DATE_FIN),
          RANG: updatedMission.RANG,
        };
      }
      this.closePopup();
    } catch (err) {
      this.notificationService.error(ERROR_MSGS.MISSION_UPDATE_FAILED, err);
    }
  }

  deleteMission(mission: DefiMission): void {
    if (!mission?._id) return;

    this.missionService.deleteMission(mission._id).subscribe({
      next: () => {
        this.notificationService.success(SUCCESS_MSGS.MISSION_DELETE_SUCCESS);
        this.missionService.defiMissions =
          this.missionService.defiMissions.filter((m) => m._id !== mission._id);
        this.closePopup();
      },
      error: (err) =>
        this.notificationService.error(ERROR_MSGS.MISSION_DELETE_FAILED, err),
    });
  }

  closePopup(): void {
    this.selectedMission = null;
  }

  toggleKanbanView(): void {
    this.showKanbanView = !this.showKanbanView;
  }

  openDeleteConfirmation(mission: DefiMission): void {
    this.missionToDelete = mission;
    this.showDeleteConfirmation = true;
  }

  openNewMissionPopup(): void {
    const dialogRef = this.dialog.open(AddMissionDialogComponent, {
      data: {
        defiId: this.defiId,
        defiStartDate: this.defiStartDate,
        defiEndDate: this.defiEndDate,
      },
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.missionService
          .assignNewMission(
            this.defiId,
            result.selectedMissionClassiqueId,
            result.newMissionStartDate,
            result.newMissionEndDate,
            result.type,
            result.rang,
          )
          .subscribe({
            next: () => {
              this.notificationService.success(
                SUCCESS_MSGS.MISSION_ASSIGN_SUCCESS,
              );
              this.fetchAllData().catch((err) =>
                console.error('Error fetching data:', err),
              );
            },
            error: (err) =>
              this.notificationService.error(
                ERROR_MSGS.MISSION_ASSIGN_FAILED,
                err,
              ),
          });
      }
    });
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
        const missionToSave = { ...updatedMission };

        this.saveMission(missionToSave);
      } else if (action === 'delete') {
        const confirmed = window.confirm(
          'Voulez-vous vraiment supprimer cette mission ?',
        );
        if (confirmed) {
          this.deleteMission(updatedMission);
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
}
