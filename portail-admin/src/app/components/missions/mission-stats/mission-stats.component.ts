import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { Subscription, Subject } from 'rxjs';
import { MissionService } from '../../../services/logic/mission.service';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { DefiMission } from '../../../interfaces/missions.interface';
import { IntervalType } from '../../../interfaces/team.interface';
import { MaterialModule } from '../../../material.module';
import { DefiTimeState } from '../../../constants/app.constants';
import { NotificationService } from '../../../services/state/notification.service';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';

@Component({
  selector: 'app-mission-stats',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './mission-stats.component.html',
  styleUrls: ['./mission-stats.component.scss'],
})
export class MissionStatsComponent implements OnInit, OnDestroy {
  private defiSubscription!: Subscription;
  private readonly destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<DefiMission>([]);
  displayedColumns: string[] = [
    'missionInfo',
    'status',
    'completionCount',
    'completionRate',
  ];

  selectedTimeInterval: IntervalType = IntervalType.GLOBAL;
  isLoading = false;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly missionService: MissionService,
    private readonly stateService: DefiStateService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.isLoading = true;
    const defiId = this.stateService.defiId;
    const startDate = this.stateService.startDate;
    const endDate = this.stateService.endDate;

    if (defiId && startDate && endDate) {
      this.loadData(defiId, startDate, endDate);
    } else {
      this.isLoading = false;
      this.notificationService.error(
        ERROR_MSGS.MISSION_FETCH_FAILED,
        'Missing required data',
      );
    }
  }

  private async loadData(defiId: string, startDate: Date, endDate: Date) {
    try {
      this.dataSource.data = await this.missionService.getMissionsByDefiId(defiId, startDate, endDate);
      this.dataSource.sort = this.sort;
      this.setupSortingAccessor();
      this.applySort();
    } catch (error) {
      this.notificationService.error(ERROR_MSGS.MISSION_FETCH_FAILED, error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    if (this.defiSubscription) {
      this.defiSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getMissionTags(mission: DefiMission): string[] {
    if (!mission?.DATE_DEBUT || !mission?.DATE_FIN) {
      return [];
    }

    const startDate = new Date(mission.DATE_DEBUT);
    const endDate = new Date(mission.DATE_FIN);

    return this.stateService.allTimeSlots
      .filter(
        (slot) => slot.START_DATE <= endDate && slot.END_DATE >= startDate,
      )
      .map((slot) => slot.LABEL);
  }

  getClass(state: string): string {
    if (
      state === DefiTimeState.EN_ATTENTE ||
      state === DefiTimeState.PRE_DEFI
    ) {
      return 'status en-attente';
    } else if (
      state === DefiTimeState.SEMAINE_1 ||
      state === DefiTimeState.SEMAINE_2 ||
      state === DefiTimeState.SEMAINE_3 ||
      state === DefiTimeState.SEMAINE_4
    ) {
      return 'status en-cours';
    }
    return 'status termine';
  }

  private setupSortingAccessor(): void {
    this.dataSource.sortingDataAccessor = (item: DefiMission, property) => {
      switch (property) {
        case 'name':
          return item.TITRE_FR?.toLowerCase() || '';
        case 'missionInfo':
          return item.TITRE_FR?.toLowerCase() || '';
        case 'status':
          return item.DATE_DEBUT.getTime() || '';
        case 'completionCount':
          return item.COMPLETION ? item.COMPLETION : 0;
        case 'completionRate':
          return item.TAUX_COMPLETION ? item.TAUX_COMPLETION : 0;
        default:
          return item[property as keyof DefiMission]?.toString().toLowerCase() || '';
      }
    };
  }

  applySort(): void {
    if (this.sort) {
      this.sort.active = 'status';
      this.sort.direction = 'desc';
      this.sort.sortChange.emit();
    }
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return;
    }
    
    this.dataSource.sort = this.sort;
  }

}
