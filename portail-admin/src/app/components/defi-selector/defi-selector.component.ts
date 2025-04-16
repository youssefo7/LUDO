import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Defi } from '../../interfaces/defi.interface';
import { DefiStateService } from '../../services/state/defi-state.service';
import { DefiService } from '../../services/logic/defi.service';
import { MatDialog } from '@angular/material/dialog';
import { DefiSelectorDialogComponent } from '../general-dialogs/defi-selector-dialog/defi-selector-dialog.component';
import { MaterialModule } from '../../material.module';
import { formatDateRange } from '../../utils/date-utils';

@Component({
  selector: 'app-defi-selector',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './defi-selector.component.html',
  styleUrl: './defi-selector.component.scss',
})
export class DefiSelectorComponent implements OnInit, OnDestroy {
  defi!: Defi | null;
  private subscription!: Subscription;

  constructor(
    protected stateService: DefiStateService,
    protected defiService: DefiService,
    private readonly dialog: MatDialog,
  ) {}

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

  protected formattedDateRange(
    start: Date | undefined,
    end: Date | undefined,
  ): string {
    return formatDateRange(start, end);
  }
}
