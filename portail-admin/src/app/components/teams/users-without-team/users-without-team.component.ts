import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDetailsComponent } from '../user-details/user-details.component';
import { MaterialModule } from '../../../material.module';
import { UserCardComponent } from '../user-card/user-card.component';
import { User } from '../../../interfaces/user.interface';
import { NotificationService } from '../../../services/state/notification.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { TeamService } from '../../../services/logic/team.service';

@Component({
  selector: 'app-users-without-team',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, UserCardComponent],
  templateUrl: './users-without-team.component.html',
  styleUrls: ['./users-without-team.component.scss'],
})
export class UsersWithoutTeamComponent implements OnInit {
  allUsers: User[] = [];
  searchQuery = '';

  constructor(
    public dialogRef: MatDialogRef<UsersWithoutTeamComponent>,
    private readonly teamService: TeamService,
    private readonly dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public DEFI: string,
    private readonly notificationService: NotificationService,
  ) {}

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.allUsers;
    }
    return this.allUsers.filter((user) =>
      user.NOM.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      user.PRENOM.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  ngOnInit(): void {
    this.loadUsersInDefiWithoutTeam();
  }

  async loadUsersInDefiWithoutTeam() {
    try {
      this.allUsers = await this.teamService.searchUsersWithoutTeamInDefi(this.DEFI ?? '');
    } catch (err) {
      this.notificationService.error(
        ERROR_MSGS.TEAM_MEMBERS_FETCH_FAILED,
        err,
      );
    }
  }

  viewParticipant(participant: User): void {
    const dialogRef = this.dialog.open(UserDetailsComponent, {
      data: {
        user: participant,
        fromLeaderboard: false  
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsersInDefiWithoutTeam();
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
