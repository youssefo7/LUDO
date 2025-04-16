// src/app/components/teams-list/teams-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TeamDetailsComponent } from '../team-details/team-details.component';
import { UsersWithoutTeamComponent } from '../users-without-team/users-without-team.component';
import { TeamCreationFormComponent } from '../team-creation-form/team-creation-form.component';
import { Team } from '../../../interfaces/team.interface';
import { MaterialModule } from '../../../material.module';
import { TeamService } from '../../../services/logic/team.service';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { Subscription } from 'rxjs';
import { TeamSeparationDialogComponent } from '../../general-dialogs/team-separation-dialog/team-separation-dialog.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss'],
})
export class TeamsListComponent implements OnInit, OnDestroy {
  private defiSubscription!: Subscription;
  private teamSubscription!: Subscription;
  teams: Team[] = [];
  searchQuery = '';
  tailleEquipe = 10;

  constructor(
    private readonly dialog: MatDialog,
    protected teamService: TeamService,
    private readonly stateService: DefiStateService,
  ) {}

  ngOnInit(): void {
    this.defiSubscription = this.stateService.defi$.subscribe(async () => {
      this.fetchTeams();
      this.tailleEquipe = this.stateService.defi?.TAILLE_EQUIPE || 10;
    });
    this.teamSubscription = this.teamService.teams$.subscribe((teams) => {
      this.teams = teams;
    });
  }

  get filteredTeams(): Team[] {
    if (!this.searchQuery.trim()) {
      return this.teams;
    }
    return this.teams.filter((team) =>
      team.NOM.toLowerCase().includes(this.searchQuery.toLowerCase()),
    );
  }

  onTeamClick(team: Team): void {
    const dialogRef = this.dialog.open(TeamDetailsComponent, {
      data: {
        team: team,
        defiId: this.stateService.defiId,
        readOnly: false,
      },
      width: '40vw',
      height: '80vh',
      maxWidth: '100vw',
      panelClass: 'team-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'refresh') {
        this.fetchTeams();
      }
    });
  }

  showNoTeamUsers(): void {
    this.dialog.open(UsersWithoutTeamComponent, {
      data: this.stateService.defiId,
      width: '40%',
      maxHeight: '60%',
    });
  }

  createTeam(): void {
    this.dialog.open(TeamCreationFormComponent, {
      data: this.stateService.defiId,
      width: '40%',
    });
  }

  showTeamSeparationDialog(): void {
    this.dialog.open(TeamSeparationDialogComponent, {
      data: this.stateService.defiId,
      width: '40%',
    });
  }

  private async fetchTeams(): Promise<void> {
    const defiId = this.stateService.defiId;
    if (defiId) {
      await this.teamService.fetchTeams(defiId);
    }
  }

  ngOnDestroy(): void {
    this.defiSubscription?.unsubscribe();
    this.teamSubscription?.unsubscribe();
  }
}
