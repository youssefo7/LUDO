import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MaterialModule } from '../../../material.module';
import { CompetitionLeaderboardComponent } from '../competition-leaderboard/competition-leaderboard.component';
import { ParticipantLeaderboardComponent } from '../participant-leaderboard/participant-leaderboard.component';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { IntervalType, PointsType, TabLeaderboard } from '../../../interfaces/team.interface';
import { TeamService } from '../../../services/logic/team.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MaterialModule,
    MatSortModule,
    MatPaginatorModule,
    FormsModule,
    CompetitionLeaderboardComponent,
    ParticipantLeaderboardComponent,
    MatButtonToggleModule,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent {
  timeEnum = IntervalType;
  pointsEnum = PointsType;
  tabType = TabLeaderboard;
  @ViewChild('participantLeaderboard') participantLeaderboard!: ParticipantLeaderboardComponent;
  @ViewChild('teamLeaderboard') teamLeaderboard!: CompetitionLeaderboardComponent;

  constructor(protected teamService: TeamService, private activatedRoute: ActivatedRoute) {}

  protected onValPointsChange(value: PointsType){
    this.teamService.selectedPointsType = value;
  }

  protected onValTimeChange(value: IntervalType){
    this.teamService.selectedIntervalType = value;
  }

  protected async onTabChanged(event: MatTabChangeEvent) {
    this.teamService.selectedTabIndex = event.index
    // Don't fetch if already fetched
    if(this.teamService.teams.length === 0) {
      await this.teamService.fetchTeams(this.activatedRoute.snapshot.params['id']);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if(this.teamService.selectedTabIndex === 0) {
      this.teamLeaderboard.dataSource.filter = filterValue;
      if (this.teamLeaderboard.dataSource.paginator) {
        this.teamLeaderboard.dataSource.paginator.firstPage();
      }
    } else {
      this.participantLeaderboard.dataSource.filter = filterValue;
      if (this.participantLeaderboard.dataSource.paginator) {
        this.participantLeaderboard.dataSource.paginator.firstPage();
      }
    }
  }
}
