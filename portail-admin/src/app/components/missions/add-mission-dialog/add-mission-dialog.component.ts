import { Component, Inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, NgForm, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../material.module';
import { MissionService } from '../../../services/logic/mission.service';
import { MISSION_TYPE } from '../../../interfaces/missions.interface';
import { TimeSlot } from '../../../interfaces/defi.interface';
import { DefiStateService } from '../../../services/state/defi-state.service';
import { FR_DATE_LANG } from '../../../constants/app.constants';
import { Observable, Subject, startWith, map } from 'rxjs';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

export interface AddMissionDialogData {
  defiId: string;
  defiStartDate: Date;
  defiEndDate: Date;
}

interface MissionDto {
  MISSION_ID: string;
  TITRE_FR: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-add-mission-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './add-mission-dialog.component.html',
  styleUrls: ['./add-mission-dialog.component.scss'],
})
export class AddMissionDialogComponent implements OnInit, OnDestroy {
  @ViewChild(MatAutocompleteTrigger, { static: false }) autocompleteTrigger!: MatAutocompleteTrigger;

  selectedMissionId = '';
  newMissionStartDate!: Date;
  newMissionEndDate!: Date;
  rang = 1; 
  
  MISSION_TYPE = MISSION_TYPE;
  selectedMissionType: MISSION_TYPE | null = null;
  missionTypes = Object.values(MISSION_TYPE);

  selectedPhases: TimeSlot[] = [];
  isDatePickerVisible = false;
  datePipe: DatePipe;
  private preventDateChange = false;

  // For autocomplete search
  missionSearchCtrl = new FormControl('');
  filteredMissions: Observable<MissionDto[]>;
  private _onDestroy = new Subject<void>();
  selectedMission: MissionDto | null = null;
  private _lastOpenedMissionType: MISSION_TYPE | null = null;
  private _missionsLoaded = false;

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor(
    protected readonly missionService: MissionService,
    private readonly dialogRef: MatDialogRef<AddMissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMissionDialogData,
    protected stateService: DefiStateService,
  ) {
    this.datePipe = new DatePipe(FR_DATE_LANG);
    
    this.filteredMissions = this.missionSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (value && typeof value === 'object') {
          return [value as MissionDto];
        }
        return this._filterMissions(value || '');
      })
    );
  }

  ngOnInit(): void {
    let minDate = new Date();
    if((this.stateService.defi?.DATE_DEBUT ?? 0) < minDate)
      minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);

    this.newMissionStartDate = minDate;
    this.newMissionEndDate = this.data.defiEndDate;
    
    this.range.controls.start.setValue(this.newMissionStartDate);
    this.range.controls.end.setValue(this.newMissionEndDate);

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
        
        this.newMissionStartDate = start;
        this.newMissionEndDate = adjustedEnd;
      }
    });
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  onClose(): void {
    this.dialogRef.close(null);
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) return;
    
    const rangValue = this.missionService.formatRangValue(this.rang);
    
    this.dialogRef.close({
      selectedMissionClassiqueId: this.selectedMissionId,
      newMissionStartDate: this.newMissionStartDate,
      newMissionEndDate: this.newMissionEndDate,
      type: this.selectedMissionType,
      rang: rangValue
    });
  }

  fetchMissionList() {
    if (this.selectedMissionType !== null) {
      this.missionService.fetchMissions(this.selectedMissionType);
      
      setTimeout(() => {
        this._missionsLoaded = true;
        this.missionSearchCtrl.setValue('');
        
        if (this.autocompleteTrigger && document.activeElement === this.getInputElement()) {
          this.autocompleteTrigger.openPanel();
        }
      }, 100);
    }
  }

  private getInputElement(): HTMLElement | null {
    if (!this.autocompleteTrigger || !this.autocompleteTrigger.autocomplete) {
      return null;
    }
    
    const autocompleteId = this.autocompleteTrigger.autocomplete.id;
    const inputSelector = `input[aria-controls="${autocompleteId}"]`;
    return document.querySelector(inputSelector);
  }

  private _filterMissions(value: string): MissionDto[] {
  if (!this.selectedMissionType) {
    return [];
  }

  const missions = this.getCorrectMissionList() || [];

  const filtered = !value || value.trim() === ''
    ? missions
    : missions.filter(mission =>
        mission.TITRE_FR.toLowerCase().includes(value.toLowerCase())
      );

  return filtered.sort((a, b) => a.TITRE_FR.localeCompare(b.TITRE_FR));
}
  
  static displayMissionFn(mission: MissionDto | string | null): string {
    if (mission && typeof mission === 'object') {
      return mission.TITRE_FR;
    }
    return mission as string || '';
  }
  
  get displayFn() {
    return AddMissionDialogComponent.displayMissionFn;
  }
  
  missionSelected(event: { option: { value: MissionDto } }): void {
    this.selectedMission = event.option.value;
    this.selectedMissionId = this.selectedMission.MISSION_ID;
    
    setTimeout(() => {
      if (this.autocompleteTrigger) {
        this.autocompleteTrigger.closePanel();
        const inputElement = this.getInputElement();
        if (inputElement) {
          inputElement.blur();
        }
      }
    });
  }

  getCorrectMissionList(): MissionDto[] {
    if (this.selectedMissionType === MISSION_TYPE.CLASSIQUE) {
      return (this.missionService.missionsClassiques || []) as unknown as MissionDto[];
    } else if (this.selectedMissionType === MISSION_TYPE.MILESTONE) {
      return (this.missionService.missionsMilestones || []) as unknown as MissionDto[];
    }
    return (this.missionService.missionsBundles || []) as unknown as MissionDto[];
  }

  onInputFocus(): void {
    if (this.selectedMissionId && this.selectedMission) {
      return;
    }
    
    if (this.selectedMissionType) {
      if (this._lastOpenedMissionType !== this.selectedMissionType || !this._missionsLoaded) {
        this._lastOpenedMissionType = this.selectedMissionType;
        this.fetchMissionList();
      } else if (this.autocompleteTrigger) {
        setTimeout(() => {
          this.autocompleteTrigger.openPanel();
        }, 0);
      }
    }
  }

  forceShowOptions(): void {
    if (this.autocompleteTrigger && !this.autocompleteTrigger.panelOpen) {
      const currentValue = this.missionSearchCtrl.value;
      
      if (currentValue && typeof currentValue === 'object') {
        const selectedMission = currentValue;
        this.missionSearchCtrl.setValue('');
        const inputElement = this.getInputElement();
        if (inputElement) {
          inputElement.focus();
        }
        this.autocompleteTrigger.openPanel();
        setTimeout(() => {
          this.missionSearchCtrl.setValue(selectedMission);
        }, 50);
      } else {
        this.autocompleteTrigger.openPanel();
      }
    }
  }

  toggleSelection(phase: TimeSlot) {
    this.preventDateChange = true;
    this.selectedPhases = this.missionService.togglePhaseSelection(
      phase, 
      this.selectedPhases,
      this.stateService.allTimeSlots
    );
    this.updateDateRange();
  }

  toggleDatePicker(event: Event) {
    event.preventDefault();
    this.isDatePickerVisible = !this.isDatePickerVisible;
  }

  protected formattedDate(value: Date | null): string {
    return value !== null ? (this.datePipe.transform(value, 'EEEE d MMM HH:mm') ?? 'Date invalide') : 'Date vide';
  }

  protected dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    let minDate = new Date();
    if((this.stateService.defi?.DATE_DEBUT ?? 0) < minDate)
      minDate = new Date(this.stateService.defi?.DATE_DEBUT ?? 0);
    minDate.setDate(minDate.getDate());
    const maxDate = new Date(this.data.defiEndDate);
    maxDate.setDate(maxDate.getDate() + 14);
    return date >= minDate && date <= maxDate;
  };

  private updateDateRange() {
    const dateRange = this.missionService.updateDateRangeFromPhases(
      this.selectedPhases, 
      this.range
    );
    
    if (dateRange) {
      this.newMissionStartDate = dateRange.startDate;
      this.newMissionEndDate = dateRange.endDate;
    }
  }
}