import { Component, Inject, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { UserCardComponent } from '../../teams/user-card/user-card.component';
import {
  TeamSeparationPayload,
  TeamUser,
} from '../../../interfaces/api-response.interface';
import {
  CdkDragDrop,
  CdkDropList,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { TeamService } from '../../../services/logic/team.service';
import { NotificationService } from '../../../services/state/notification.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { DefiStateService } from '../../../services/state/defi-state.service';

@Component({
  selector: 'app-team-separation-dialog',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    UserCardComponent,
    DragDropModule,
    CdkDropList,
  ],
  templateUrl: './team-separation-dialog.component.html',
  styleUrl: './team-separation-dialog.component.scss',
})
export class TeamSeparationDialogComponent implements OnInit {
  teamSeparationForm!: FormGroup;
  isLoading = false;
  isProposed = false;
  proposedTeams: TeamSeparationPayload[] = [];
  errorMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly teamService: TeamService,
    public dialogRef: MatDialogRef<TeamSeparationDialogComponent>,
    private readonly dialog: MatDialog,
    private readonly stateService: DefiStateService,
    @Inject(MAT_DIALOG_DATA) public defiId: string,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const tailleEquipesDefault = this.stateService.defi?.TAILLE_EQUIPE || 10;
    this.teamSeparationForm = this.fb.group({
      maxUsersPerTeam: [
        tailleEquipesDefault,
        [Validators.required, Validators.min(2)],
      ], // Minimum 2 users per team
      maxTeams: ['', [Validators.min(2)]], // Minimum 2 teams if specified
      separateDepartments: [true],
    });
  }

  onSubmit(): void {
    if (this.teamSeparationForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      const { maxUsersPerTeam, maxTeams, separateDepartments } =
        this.teamSeparationForm.value;

      this.teamService
        .getTeamSeparationProposition(
          this.defiId,
          maxUsersPerTeam,
          maxTeams,
          separateDepartments,
        )
        .subscribe({
          next: (proposedTeams) => {
            this.proposedTeams = proposedTeams;
            this.isProposed = true;
            this.teamService.fetchTeams(this.defiId);
          },
          error: (err) => {
            this.isLoading = false;
            this.notificationService.error(ERROR_MSGS.EQUIPE_GET_FAILED, err);
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  drop(event: CdkDragDrop<TeamUser[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  confirmTeams(): void {
    this.isLoading = true;
    this.errorMessage = null; // Reset error

    this.teamService.confirmTeamSeparation(this.proposedTeams).subscribe({
      next: () => {
        this.dialogRef.close();
      },
      error: (err) => {
        this.notificationService.error(ERROR_MSGS.EQUIPE_CONFIRM_FAILED, err);
        this.isLoading = false;
      },
      complete: () => {
        this.notificationService.success(SUCCESS_MSGS.EQUIPE_CONFIRM_SUCCESS);
        this.isLoading = false;
      },
    });
  }

  estimatePoint(teamId: string): number {
    const team = this.proposedTeams.find((team) => team.teamId === teamId);
    if (!team) {
      console.error(`Team with ID ${teamId} not found`);
      return 0;
    }

    return team.users.reduce((sum, user) => sum + (user.estimatedPts || 0), 0);
  }

  get connectedDropLists(): string[] {
    return this.proposedTeams.map((t) => t.teamId);
  }
}
