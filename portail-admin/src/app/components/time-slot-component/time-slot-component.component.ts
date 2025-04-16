import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Defi } from '../../interfaces/defi.interface';
import { DefiService } from '../../services/logic/defi.service';
import { DefiStateService } from '../../services/state/defi-state.service';
import { DefiSelectorDialogComponent } from '../general-dialogs/defi-selector-dialog/defi-selector-dialog.component';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FR_DATE_LANG } from '../../constants/app.constants';
import { ActivatedRoute } from '@angular/router';
import { formatDateRange } from '../../utils/date-utils';

@Component({
  selector: 'app-time-slot-component',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatChipsModule, MatIcon],
  templateUrl: './time-slot-component.component.html',
  styleUrl: './time-slot-component.component.scss',
})
export class TimeSlotComponentComponent implements OnInit, OnDestroy {
  defi!: Defi | null;
  private subscription!: Subscription;
  datePipe: DatePipe;

  constructor(
    protected readonly stateService: DefiStateService,
    protected readonly defiService: DefiService,
    private readonly dialog: MatDialog,
    private route: ActivatedRoute,
  ) {
    this.datePipe = new DatePipe(FR_DATE_LANG);
  }

  ngOnInit() {
    this.subscription = this.stateService.defi$.subscribe((defi) => {
      this.defi = defi;
      this.defiService.setInitialTimeSlots();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openSelectorDialog(): void {
    this.dialog.open(DefiSelectorDialogComponent, {
      width: '40%',
      data: { defi: this.stateService.defi },
    });
  }

  protected isGlobal(): boolean {
    return !this.route.snapshot.paramMap.has('id');
  }

  protected formattedDate(value: Date | null): string {
    return value !== null
      ? this.datePipe.transform(value, 'd/MM/yyyy') || 'Date invalide'
      : 'Date vide';
  }

  protected formattedDateRange(
    start: Date | undefined,
    end: Date | undefined,
  ): string {
    return formatDateRange(start, end);
  }
}
