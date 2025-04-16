import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Team } from '../../../interfaces/team.interface';
import { User } from '../../../interfaces/user.interface';
import { UserDetailsComponent } from '../user-details/user-details.component';
import { MaterialModule } from '../../../material.module';
import { UserCardComponent } from '../user-card/user-card.component';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { TeamService } from '../../../services/logic/team.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-team-details',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    UserCardComponent,
    FormsModule,
  ],
  templateUrl: './team-details.component.html',
  styleUrls: ['./team-details.component.scss'],
})
export class TeamDetailsComponent implements OnInit {
  teamForm!: FormGroup;
  participants: User[] = [];
  isAddingMember = false;
  searchQuery = '';
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  isDeleting = false;
  tailleEquipe = 10;
  private defiSubscription!: Subscription;

  // Sliding Panels States
  readOnly = false;
  isEditing = false;

  processingUsers: Map<string, boolean> = new Map();

  constructor(
    private readonly fb: FormBuilder,
    private readonly teamService: TeamService,

    private readonly defiStateService: DefiStateService,
    public dialogRef: MatDialogRef<TeamDetailsComponent>,
    private readonly dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: { team: Team; defiId: string; readOnly?: boolean },
    private readonly notificationService: NotificationService,
  ) {
    this.readOnly = data.readOnly || false;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadTeamMembers();
    this.defiSubscription = this.defiStateService.defi$.subscribe(async () => {
      this.tailleEquipe = this.defiStateService.defi?.TAILLE_EQUIPE || 10;
    });
  }

  initializeForm(): void {
    this.teamForm = this.fb.group({
      teamName: [this.data.team.NOM || '', Validators.required],
      teamImage: [this.data.team.IMAGE || ''],
      teamSlogan: [this.data.team.SLOGAN || ''],
    });
  }

  async loadTeamMembers() {
    try {
      this.participants = await this.teamService.getTeamMembers(
        this.data.team._id ?? '',
      );
    } catch (err) {
      this.notificationService.error(ERROR_MSGS.TEAM_MEMBERS_FETCH_FAILED, err);
    }
  }

  toggleEdit(): void {
    this.isAddingMember = false;
    this.isEditing = !this.isEditing;
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      const { ...restOfTeam } = this.data.team;
      const updatedTeam: Team = {
        ...restOfTeam,
        NOM: this.teamForm.value.teamName,
        IMAGE: this.teamForm.value.teamImage,
        SLOGAN: this.teamForm.value.teamSlogan,
      };

      this.teamService
        .updateTeam(this.data.team._id ?? '', updatedTeam)
        .subscribe({
          next: () => {
            this.data.team = updatedTeam;
            this.isEditing = false;
            this.notificationService.success(SUCCESS_MSGS.TEAM_UPDATE_SUCCESS);
            this.teamService.fetchTeams(this.data.team.DEFI);
          },
          error: (err) => {
            this.notificationService.error(ERROR_MSGS.TEAM_UPDATE_FAILED, err);
          },
        });
    }
    this.isEditing = !this.isEditing;
  }

  onCancel(): void {
    this.initializeForm();
    this.isEditing = false;
  }

  onClosed(): void {
    this.dialogRef.close();
  }

  openAddMemberPanel(): void {
    this.isAddingMember = true;
    this.loadUsersInDefiWithoutTeam();
  }

  closeAddMemberPanel(): void {
    this.isAddingMember = false;
    this.searchQuery = '';
    this.filteredUsers = [];
  }

  async loadUsersInDefiWithoutTeam() {
    const DEFI = this.data.team.DEFI;
    try {
      this.allUsers = await this.teamService.searchUsersWithoutTeamInDefi(
        DEFI ?? '',
      );
      this.filteredUsers = this.allUsers;
    } catch (err) {
      this.notificationService.error(ERROR_MSGS.TEAM_MEMBERS_FETCH_FAILED, err);
    }
  }

  searchUsersByName(): void {
    if (this.searchQuery.trim()) {
      this.filteredUsers = this.allUsers.filter(
        (user) =>
          user.PRENOM?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.NOM?.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
    } else {
      this.filteredUsers = this.allUsers;
    }
  }

  addUser(user: User): void {
    if (!user._id || this.processingUsers.get(user._id)) {
      return; 
    }
    
    if (this.data.team._id && user._id) {
      this.processingUsers.set(user._id, true);
      
      this.teamService.addTeamMember(this.data.team._id, user._id).subscribe({
        next: () => {
          this.participants.push(user);
          this.filteredUsers = this.filteredUsers.filter(
            (u) => u._id !== user._id,
          );
          this.allUsers = this.allUsers.filter(
            (u) => u._id !== user._id,
          );
          // this.closeAddMemberPanel(); leaving it comented in case we want to allow batch adding
          this.notificationService.success(
            SUCCESS_MSGS.TEAM_ASSIGN_MEMBER_SUCCESS,
          );
          if (user._id) {
            this.processingUsers.delete(user._id);
          }
        },
        error: (err) => {
          this.notificationService.error(
            ERROR_MSGS.TEAM_ASSIGN_MEMBER_FAILED,
            err,
          );
          if (user._id) {
            this.processingUsers.delete(user._id);
          }
        },
      });
    }
  }

  viewParticipant(user: User): void {
    const dialogRef = this.dialog.open(UserDetailsComponent, {
      data: {
        user: user,
        fromLeaderboard: false,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.refresh) {
        this.loadTeamMembers();
      }
    });
  }

  removeParticipant(user: User): void {
    if (!user._id || this.processingUsers.get(user._id)) {
      return; // Skip if user id is missing or already processing
    }
    
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir retirer ce participant de l'équipe ?",
      )
    ) {
      if (user._id) {
        this.processingUsers.set(user._id, true);
      }
      
      this.teamService
        .removeUserFromTeam(user._id ?? '', this.data.team._id ?? '')
        .subscribe({
          next: () => {
            this.participants = this.participants.filter((u) => u !== user);
            this.notificationService.success(
              SUCCESS_MSGS.USER_DELETE_FROM_TEAM_SUCCESS,
            );
            if (user._id) {
              this.processingUsers.delete(user._id);
            }
          },
          error: (err: HttpErrorResponse) => {
            this.notificationService.error(
              ERROR_MSGS.USER_DELETE_FROM_TEAM_FAILED,
              err,
            );
            this.isDeleting = false;
            if (user._id) {
              this.processingUsers.delete(user._id);
            }
          },
        });
    }
  }

  onDeleteTeam() {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) {
      this.isDeleting = true;
      this.teamService.deleteTeam(this.data.team._id ?? '').subscribe({
        next: () => {
          this.teamService.removeTeam(this.data.team._id ?? '');
          this.dialogRef.close();
          this.notificationService.success(SUCCESS_MSGS.TEAM_DELETE_SUCCESS);
        },
        error: (err) => {
          this.notificationService.error(ERROR_MSGS.TEAM_DELETE_FAILED, err);
          this.isDeleting = false;
        },
      });
    }
  }

  isProcessingUser(userId: string): boolean {
    return this.processingUsers.get(userId) || false;
  }
}
