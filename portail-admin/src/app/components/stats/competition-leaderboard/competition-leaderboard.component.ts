import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamService } from '../../../services/logic/team.service';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { IntervalType, PointsType, Team } from '../../../interfaces/team.interface';
import { TeamDetailsComponent } from '../../teams/team-details/team-details.component';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-competition-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './competition-leaderboard.component.html',
  styleUrls: ['./competition-leaderboard.component.scss'],
})
export class CompetitionLeaderboardComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedPointsType: PointsType = PointsType.TOTAL;
  selectedTimeInterval: IntervalType = IntervalType.WEEK;
  
  dataSource = new MatTableDataSource<Team>([]);
  displayedColumns: string[] = ['teamInfo', 'points'];
  
  enumPoints = PointsType;
  enumInterval = IntervalType;

  private teamsSubscription: Subscription | null = null;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public teamService: TeamService,
    private readonly stateService: DefiStateService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    this.teamsSubscription = this.teamService.teams$.subscribe(teams => {
      if (teams.length > 0) {
        this.dataSource.data = teams;
        setTimeout(() => this.applySort());
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.setupSorting();
    
    setTimeout(() => this.applySort());
  }

  ngOnDestroy(): void {
    if (this.teamsSubscription) {
      this.teamsSubscription.unsubscribe();
      this.teamsSubscription = null;
    }
  }

  loadData(): void {
    if (this.stateService.defiId) {
      this.teamService.fetchTeams(this.stateService.defiId);
    }
  }

  onTimeIntervalChange(value: IntervalType) {
    this.selectedTimeInterval = value;
    this.refreshDisplay();
  }
  
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  setupSorting(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.NOM || '';
        case 'points':
          return this.getSelectedPointsDefi(item);
        default:
          return item[property as keyof Team] as string || '';
      }
    };
  }

  getSelectedPointsDefi(team: Team): number {
    if (this.selectedPointsType === PointsType.ACTIVE && this.selectedTimeInterval === IntervalType.GLOBAL) {
      return team.POINTS_ACTIFS || 0;
    }
    if (this.selectedPointsType === PointsType.BONUS && this.selectedTimeInterval === IntervalType.GLOBAL) {
      return team.POINTS_BONUS || 0;
    }
    if (this.selectedPointsType === PointsType.TOTAL && this.selectedTimeInterval === IntervalType.GLOBAL) {
      return team.POINTS_TOTAL || 0;
    }
    if (this.selectedPointsType === PointsType.TOTAL && this.selectedTimeInterval === IntervalType.WEEK) {
      return team.POINT_SEMAINE_TOTAL || 0;
    }
    if (this.selectedPointsType === PointsType.BONUS && this.selectedTimeInterval === IntervalType.WEEK) {
      return team.POINTS_SEMAINE_BONUS || 0;
    }
    return team.POINTS_SEMAINE_ACTIF || 0;
  }

  applySort(): void {
    if (this.sort) {
      this.sort.active = 'points';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit();
    }
  }

  viewTeam(team: Team): void {    
    setTimeout(() => {
      this.dialog.open(TeamDetailsComponent, {
        data: { 
          team: team, 
          defiId: this.stateService.defiId,
          readOnly: true 
        },
        height: '80%',
        panelClass: 'team-dialog-container',
        position: { top: '5vh' },
        autoFocus: false,
        disableClose: false
      });
    }, 100);
  }

  onPointsTypeChange(value: PointsType): void {
    this.selectedPointsType = value;
    this.refreshDisplay();
  }

  refreshDisplay(): void {
    this.dataSource.data = [...this.dataSource.data];
    setTimeout(() => this.applySort());
  }
}
