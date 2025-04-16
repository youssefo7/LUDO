import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import {
  FormsModule,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../../services/api/auth.service';
import { DatePipe } from '@angular/common';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { TimeSlot } from '../../../interfaces/defi.interface';
import { FR_DATE_LANG } from '../../../constants/app.constants';
import { MissionService } from '../../../services/logic/mission.service';
import { DefiMission } from '../../../interfaces/missions.interface';

@Component({
  selector: 'app-mission-details-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './mission-details-dialog.component.html',
  styleUrls: ['./mission-details-dialog.component.scss'],
})
export class MissionDetailsDialogComponent implements OnInit {
  // Phase selection related properties
  selectedPhases: TimeSlot[] = [];
  isDatePickerVisible = false;
  datePipe: DatePipe;
  private preventDateChange = false;
  rang = 1;
  isSuperAdmin = false;

  // Date range form group
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor(
    private readonly dialogRef: MatDialogRef<MissionDetailsDialogComponent>,
    public authService: AuthService,
    protected stateService: DefiStateService,
    @Inject(MAT_DIALOG_DATA) public data: DefiMission,
    private readonly missionService: MissionService,
  ) {
    this.datePipe = new DatePipe(FR_DATE_LANG);
  }

  ngOnInit(): void {
    this.authService.isSuperAdmin().then((isSuperAdmin) => {
      this.isSuperAdmin = isSuperAdmin;

      let minDate = new Date();
      if((this.stateService.defi?.DATE_DEBUT ?? 0) < minDate)
        minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);
      this.range.controls.start.setValue(minDate);
      this.range.controls.end.setValue(this.data.DATE_FIN);

      this.selectedPhases = this.missionService.getPhasesByDateRange(
        this.data.DATE_DEBUT,
        this.data.DATE_FIN,
        this.stateService.allTimeSlots,
      );

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
            (slot) => slot.START_DATE >= start && slot.END_DATE <= adjustedEnd,
          );

          this.data.DATE_DEBUT = start;
          this.data.DATE_FIN = adjustedEnd;
        }
      });
    });
  }

  onClose(): void {
    this.dialogRef.close({ action: 'close' });
  }

  onSave(): void {
    const rangValue = this.missionService.formatRangValue(this.rang);

    const enhancedMission = {
      ...this.data,
      rang: rangValue,
    };

    this.dialogRef.close({
      action: 'save',
      mission: enhancedMission,
    });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', mission: this.data });
  }

  toggleSelection(phase: TimeSlot) {
    this.preventDateChange = true;
    this.selectedPhases = this.missionService.togglePhaseSelection(
      phase,
      this.selectedPhases,
      this.stateService.allTimeSlots,
    );
    this.updateDateRange();
  }

  toggleDatePicker(event: Event) {
    event.preventDefault();
    this.isDatePickerVisible = !this.isDatePickerVisible;
  }

  protected formattedDate(value: Date | null): string {
    return value !== null
      ? (this.datePipe.transform(value, 'EEEE d MMM HH:mm') ?? 'Date invalide')
      : 'Date vide';
  }

  protected dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    let minDate = new Date();
    if((this.stateService.defi?.DATE_DEBUT ?? 0) < minDate)
      minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);
    minDate.setDate(minDate.getDate());
    const maxDate = new Date(this.stateService.defi?.DATE_FIN ?? new Date());
    maxDate.setDate(maxDate.getDate() + 14);
    return date >= minDate && date <= maxDate;
  };

  private updateDateRange() {
    const dateRange = this.missionService.updateDateRangeFromPhases(
      this.selectedPhases,
      this.range,
    );

    if (dateRange) {
      this.data.DATE_DEBUT = dateRange.startDate;
      this.data.DATE_FIN = dateRange.endDate;
    }
  }
}
