import {
  AfterViewInit,
  Component,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { TeamService } from '../../../services/logic/team.service';
import { IntervalType, PointsType } from '../../../interfaces/team.interface';
import { UserService } from '../../../services/logic/user.service';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { MatDialog } from '@angular/material/dialog';
import { UserDetailsComponent } from '../../teams/user-details/user-details.component';
import { MaterialModule } from '../../../material.module';
import { User } from '../../../interfaces/user.interface';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-participant-leaderboard',
  standalone: true,
  templateUrl: './participant-leaderboard.component.html',
  styleUrls: ['./participant-leaderboard.component.scss'],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  providers: [DatePipe],
})
export class ParticipantLeaderboardComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  selectedPointsType: PointsType = PointsType.TOTAL;
  selectedTimeInterval: IntervalType = IntervalType.WEEK;

  enumPoints = PointsType;
  enumInterval = IntervalType;

  dataSource: MatTableDataSource<User>;

  displayedColumns: string[] = [
    'userInfo',
    'lastActivity',
    'registrationDate',
    'points',
  ];

  private activeSubscriptions: Subscription[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public readonly teamService: TeamService,
    protected readonly userService: UserService,
    private readonly stateService: DefiStateService,
    protected datePipe: DatePipe,
    private readonly dialog: MatDialog,
  ) {
    this.dataSource = new MatTableDataSource<User>();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    setTimeout(() => {
      this.setupSortingAccessor();
      this.applySort();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.activeSubscriptions = [];
  }

  loadData(): void {
    const defiId = this.stateService.defiId;
    if (!defiId) return;

    this.userService.getDefiParticipantsWithStats(defiId).then(() => {
      this.dataSource.data = this.userService.users;

      if (this.sort) {
        setTimeout(() => this.applySort());
      }
    });
  }

  refreshDisplay(): void {
    this.dataSource.data = [...this.dataSource.data];
    setTimeout(() => this.applySort());
  }

  onTimeIntervalChange(value: IntervalType): void {
    this.selectedTimeInterval = value;
    this.refreshDisplay();
  }

  onPointsTypeChange(value: PointsType): void {
    this.selectedPointsType = value;
    this.refreshDisplay();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewParticipant(participant: User): void {
    const dialogRef = this.dialog.open(UserDetailsComponent, {
      data: {
        user: participant,
        fromLeaderboard: true,
        defiId: this.stateService.defiId,
      },
    });

    const defiId = this.stateService.defiId;
    const startDate = this.stateService.startDate;
    const endDate = this.stateService.endDate;

    if (defiId && startDate && endDate) {
      const countsSub = this.userService
        .fetchUserMissionAndActivityCounts(
          participant._id,
          defiId,
          startDate,
          endDate,
        )
        .subscribe((counts) => {
          dialogRef.componentInstance.updateCounts(
            counts.missionCount,
            counts.activityCount,
          );
        });

      this.activeSubscriptions.push(countsSub);
    }

    const dialogSub = dialogRef.afterClosed().subscribe((updatedUser: User) => {
      if (updatedUser) {
        const index = this.dataSource.data.findIndex(
          (u) => u._id === updatedUser._id,
        );
        if (index >= 0) {
          this.dataSource.data[index] = updatedUser;
          this.dataSource.data = [...this.dataSource.data];
        }
      }
    });

    this.activeSubscriptions.push(dialogSub);
  }

  protected getSelectedPointsDefi(element: User): number {
    const pointsMap = {
      [PointsType.ACTIVE]: {
        [IntervalType.GLOBAL]: element.POINTS_ACTIFS ?? 0,
        [IntervalType.WEEK]: element.POINTS_SEMAINE_ACTIF_DEFI ?? 0,
      },
      [PointsType.TOTAL]: {
        [IntervalType.GLOBAL]: element.POINTS_TOTAL ?? 0,
        [IntervalType.WEEK]: element.POINTS_SEMAINE_TOTAL_DEFI ?? 0,
      },
      [PointsType.BONUS]: {
        [IntervalType.GLOBAL]: element.POINTS_BONUS ?? 0,
        [IntervalType.WEEK]: element.POINT_SEMAINE_BONUS_DEFI ?? 0,
      },
    };

    return Number(pointsMap[this.selectedPointsType]?.[this.selectedTimeInterval]) || 0;
  }

  private setupSortingAccessor(): void {
    this.dataSource.sortingDataAccessor = (item, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'name':
          return (item.PRENOM || '') + ' ' + (item.NOM || '').toLowerCase();
        case 'points':
          return Number(this.getSelectedPointsDefi(item));
        case 'lastActivity':
          return item.LAST_ACTIVITY
            ? new Date(item.LAST_ACTIVITY).getTime()
            : 0;
        case 'registrationDate':
          return item.CREATED_DATE ? new Date(item.CREATED_DATE).getTime() : 0;
        default:
          return (item.NOM || '').toLowerCase();
      }
    };
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'Jamais';

    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Date invalide';

      const now = new Date();
      const diff = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diff / (1000 * 3600 * 24));

      if (diffDays === 0) {
        return "Aujourd'hui";
      } else if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else {
        return date.toLocaleDateString('fr-FR');
      }
    } catch {
      return 'Date invalide';
    }
  }

  applySort(): void {
    if (this.sort) {
      this.sort.active = 'lastActivity';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit();
    }
  }
}
