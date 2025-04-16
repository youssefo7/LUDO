import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { DefiService } from '../../../services/logic/defi.service';
import { Defi, TimeSlot } from '../../../interfaces/defi.interface';
import { DatePipe } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FR_DATE_LANG, FR_LANG, ONE_WEEK } from '../../../constants/app.constants';
import { MaterialModule } from '../../../material.module';
import { DefiStateService } from '../../../services/state/defi-state.service';

registerLocaleData(localeFr, 'fr');


@Component({
  selector: 'app-defi-selector-dialog',
  templateUrl: './defi-selector-dialog.component.html',
  styleUrls: ['./defi-selector-dialog.component.scss'],
  standalone: true,
  imports: [
    MaterialModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: FR_LANG }, provideNativeDateAdapter()],
})
export class DefiSelectorDialogComponent {
  selectedPhases: TimeSlot[] = [];
  private preventDateChange = false;

  // Date management
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  datePipe: DatePipe;
  isDatePickerVisible = false;

  constructor(
    public dialogRef: MatDialogRef<DefiSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { defi: Defi },
    protected defiService: DefiService,
    protected stateService: DefiStateService,
  ) {
    this.datePipe = new DatePipe(FR_DATE_LANG);
    this.selectedPhases = this.defiService.selectedTimeSlots.map((slot) => this.stateService.allTimeSlots.find((p) => p.LABEL === slot)).filter(Boolean) as TimeSlot[];
    this.range.controls.start.setValue(this.selectedPhases[0].START_DATE);
    this.range.controls.end.setValue(this.selectedPhases[this.selectedPhases.length - 1].END_DATE);

    this.range.valueChanges.subscribe((value) => {
      if (this.preventDateChange) {
        this.preventDateChange = false;
        return;
      }
      const { start, end } = value;
      if (start && end) {
        const adjustedEnd = new Date(end);
        adjustedEnd.setHours(23, 59, 59, 999);

        this.preventDateChange = true;
        this.range.controls.end.setValue(adjustedEnd, { emitEvent: false });
        this.selectedPhases = this.stateService.allTimeSlots.filter(
          (slot) => slot.START_DATE >= start && slot.END_DATE <= adjustedEnd
        );
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSelect(): void {
    this.dialogRef.close(this.selectedPhases.length ? this.selectedPhases : this.range.value);
    if (this.range.value.start && this.range.value.end) {
      this.defiService.confirmTimeSlots(this.range.value.start, this.range.value.end);
    }
  }

  toggleSelection(phase: TimeSlot) {
    this.preventDateChange = true;
    const index = this.stateService.allTimeSlots.indexOf(phase);
    const selectedIndices = this.selectedPhases.map(p => this.stateService.allTimeSlots.indexOf(p));
  
    if (this.selectedPhases.includes(phase)) {
      this.selectedPhases = this.selectedPhases.filter(p => p !== phase);
    } else {
      const minSelected = Math.min(...selectedIndices, index);
      const maxSelected = Math.max(...selectedIndices, index);
      const isConsecutive = this.stateService.allTimeSlots
        .slice(minSelected, maxSelected + 1)
        .every(p => this.selectedPhases.includes(p) || p === phase);
  
      if (isConsecutive) {
        this.selectedPhases.push(phase);
      } else {
        this.selectedPhases = [phase];
      }
    }
  
    this.selectedPhases.sort((a, b) => this.stateService.allTimeSlots.indexOf(a) - this.stateService.allTimeSlots.indexOf(b));
    this.updateDateRange();
  }

  protected formattedDate(value: Date | null): string {
    return value !== null ? (this.datePipe.transform(value, 'EEEE d MMM HH:mm') || 'Date invalide') : 'Date vide';
  }

  protected toggleDatePicker(event: Event) {
    event.preventDefault();
    this.isDatePickerVisible = !this.isDatePickerVisible;
  }
  
  protected dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    if (!this.data.defi) return true;
  
    const currentDate = new Date();

    const minDate = new Date(this.data.defi.DATE_DEBUT.getTime() - 8 * ONE_WEEK);

    const maxDate = this.data.defi.DATE_FIN 
      ? new Date(this.data.defi.DATE_FIN.getTime() + 2 * ONE_WEEK)
      : currentDate;

    return this.data.defi.DATE_DEBUT && date >= minDate && date <= maxDate;
  };

  private updateDateRange() {
    if (this.selectedPhases.length === 0) {
      this.range.controls.start.setValue(null);
      this.range.controls.end.setValue(null);
      return;
    }
  
    const startDate = new Date(Math.min(...this.selectedPhases.map(p => p.START_DATE.getTime())));
    const endDate = new Date(Math.max(...this.selectedPhases.map(p => p.END_DATE.getTime())));
    this.range.controls.start.setValue(startDate, { emitEvent: false });
    this.range.controls.end.setValue(endDate, { emitEvent: false });
  }
  
}
