import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { BubbleApiService } from '../../../services/api/bubble-api.service';
import { User } from '../../../interfaces/user.interface';
import { firstValueFrom } from 'rxjs';
import { DefiService } from '../../../services/logic/defi.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { NotificationService } from '../../../services/state/notification.service';
import { TeamService } from '../../../services/logic/team.service';
import { MaterialModule } from '../../../material.module';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { Defi } from '../../../interfaces/defi.interface';
import { Team } from '../../../interfaces/team.interface';

export interface UserDialogData {
  user: User;
  fromLeaderboard?: boolean;
}
@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
})
export class UserDetailsComponent implements OnInit {
  teams: Team[] = [];
  defis: Defi[] = [];
  missionCount = 0;
  activityCount = 0;

  fromLeaderboard = false;
  refresh = false;
  constructor(
    public dialogRef: MatDialogRef<UserDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private readonly defiService: DefiService,
    private readonly stateService: DefiStateService,
    private readonly bubbleApiService: BubbleApiService,
    private readonly notificationService: NotificationService,
    private readonly teamService: TeamService,
  ) {
    this.dialogRef.beforeClosed().subscribe(() => {
      this.refresh = true;
    });
  }

  ngOnInit(): void {
    this.fromLeaderboard = !!this.data.fromLeaderboard;
    this.loadAdditionalData();
  }

  private async loadAdditionalData(): Promise<void> {
    const params = new HttpParams()
      .set('USER', this.data.user._id)
      .set('DEFI', this.stateService.defiId!);
    const response = (
      await firstValueFrom(
        this.bubbleApiService.fetchSingleApi('get_users_by_id', params),
      )
    ).response as { result: string };
    const parsed = JSON.parse(response.result);
    this.data.user = {
      ...this.data.user,
      DEFIS: parsed.DEFIS.map((defi: string) => JSON.parse(defi)) as Defi[],
      EQUIPES: parsed.EQUIPES.map((team: string) => JSON.parse(team)) as Team[],
      LANG: parsed.LANG as string,
      EMAIL: parsed.EMAIL as string,
      POINTS_TOTAL: parsed.POINTS_TOTAL as number,
      POINTS_BONUS: parsed.POINTS_BONUS as number,
      POINTS_ACTIFS: parsed.POINTS_ACTIFS as number,
      MINUTES_TOTAL: parsed.MINUTES_TOTAL as number,
      POINTS_SEMAINE_TOTAL_DEFI: parsed.POINTS_SEMAINE_TOTAL_DEFI as number,
      POINTS_SEMAINE_ACTIF_DEFI: parsed.POINTS_SEMAINE_ACTIF_DEFI as number,
      POINT_SEMAINE_BONUS_DEFI: parsed.POINTS_SEMAINE_BONUS_DEFI as number,
      CREATED_DATE: parsed.CREATED_DATE as Date,
    };
    this.defis = this.data.user.DEFIS || [];
    this.teams = this.data.user.EQUIPES || [];
  }

  removeFromDefi(userId: string, defiId: string) {
    if (confirm('Êtes-vous sûr de vouloir retirer cet utilisateur du défi ?')) {
      this.defiService.removeUserFromDefi(userId, defiId).subscribe({
        next: () => {
          this.defis = this.defis.filter((defi) => defi._id !== defiId);
          this.notificationService.success(
            SUCCESS_MSGS.USER_DELETE_FROM_DEFI_SUCCESS,
          );
          this.refresh = true;
        },
        error: (err: HttpErrorResponse) => {
          this.notificationService.error(
            ERROR_MSGS.USER_DELETE_FROM_DEFI_FAILED,
            err,
          );
        },
      });
    }
  }

  removeFromTeam(userId: string, teamId: string) {
    if (
      confirm("Êtes-vous sûr de vouloir retirer cet utilisateur de l'équipe ?")
    ) {
      this.teamService.removeUserFromTeam(userId, teamId).subscribe({
        next: () => {
          this.teams = this.teams.filter((team) => team._id !== teamId);
          this.notificationService.success(
            SUCCESS_MSGS.USER_DELETE_FROM_TEAM_SUCCESS,
          );
          this.refresh = true;
        },
        error: (err: HttpErrorResponse) => {
          this.notificationService.error(
            ERROR_MSGS.USER_DELETE_FROM_TEAM_FAILED,
            err,
          );
        },
      });
    }
  }

  updateCounts(missionCount: number, activityCount: number): void {
    this.missionCount = missionCount;
    this.activityCount = activityCount;
  }
}
