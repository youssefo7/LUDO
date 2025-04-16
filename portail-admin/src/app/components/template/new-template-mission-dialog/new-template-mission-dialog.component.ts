import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TemplatesService } from '../../../services/logic/templates.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { MISSION_TYPE } from '../../../interfaces/missions.interface';
import { WEEKS } from '../../../constants/app.constants';
import { NotificationService } from '../../../services/state/notification.service';
import { SUCCESS_MSGS } from '../../../constants/succes-msg.constant';
import { ERROR_MSGS } from '../../../constants/error-msg.constant';
import { MissionService } from '../../../services/logic/mission.service';
import { Observable, startWith, map } from 'rxjs';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

interface MissionDto {
  MISSION_ID: string;
  TITRE_FR: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-new-template-mission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
  templateUrl: './new-template-mission-dialog.component.html',
  styleUrl: './new-template-mission-dialog.component.scss'
})
export class NewTemplateMissionDialogComponent {
  @ViewChild(MatAutocompleteTrigger, { static: false }) autocompleteTrigger!: MatAutocompleteTrigger;

  selectedMissionId = '';
  selectedWeek: number | null = null;
  newMissionStartDate: Date | null = null;
  newMissionEndDate: Date | null = null;

  MISSION_TYPE = MISSION_TYPE;
  selectedMissionType: MISSION_TYPE | null = null;
  missionTypes = Object.values(MISSION_TYPE);

  weeks = WEEKS
  rang = 1;

  selectedWeeks: { label: string; start: number; end: number }[] = [];
  showCustomOffsets = false;
  customDebut: number | null = 0;
  customFin: number | null = 0;
  isSubmitting = false;

  missionSearchCtrl = new FormControl('');
  filteredMissions: Observable<MissionDto[]>;
  selectedMission: MissionDto | null = null;
  private _lastOpenedMissionType: MISSION_TYPE | null = null;
  private _missionsLoaded = false;

  constructor(
    private readonly dialogRef: MatDialogRef<NewTemplateMissionDialogComponent>,
    private readonly templatesService: TemplatesService,
    private readonly notificationService: NotificationService,
    private readonly missionService: MissionService,
    @Inject(MAT_DIALOG_DATA) public data: {
      templateId: string;
      templateStartDate: Date;
    },
  ) {
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

  onClose(): void {
    this.dialogRef.close(null);
  }

  toggleWeek(week: { label: string; start: number; end: number }): void {
    const index = this.selectedWeeks.indexOf(week);
    const weekIdx = this.weeks.indexOf(week);
  
    if (index >= 0) {
      const newSelection = [...this.selectedWeeks];
      newSelection.splice(index, 1);
  
      const sorted = newSelection
        .map(w => this.weeks.indexOf(w))
        .sort((a, b) => a - b);
  
      const isStillConsecutive = sorted.every((val, i, arr) =>
        i === 0 || val === arr[i - 1] + 1
      );
  
      if (isStillConsecutive || newSelection.length === 0) {
        this.selectedWeeks = newSelection;
      }
    } else {
      const selectedIndices = this.selectedWeeks.map(w => this.weeks.indexOf(w));
      selectedIndices.push(weekIdx);
      selectedIndices.sort((a, b) => a - b);
  
      const isConsecutive = selectedIndices.every((val, i, arr) =>
        i === 0 || val === arr[i - 1] + 1
      );
  
      if (isConsecutive) {
        this.selectedWeeks.push(week);
      } else {
        this.selectedWeeks = [week];       
      }
    }
    if(this.selectedWeeks.length !== 0) {
      this.selectedWeeks.sort((a, b) => a.start - b.start);
      this.customDebut = this.selectedWeeks[0].start;
      this.customFin = this.selectedWeeks[this.selectedWeeks.length - 1].end;
    }
  }

  toggleCustomOffsets(): void {
    this.showCustomOffsets = !this.showCustomOffsets;
  }

  assignNewTemplateMission(): void {
    if (!this.selectedMissionId || this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    
    let offsetStart: number;
    let offsetEnd: number;
    
    if (this.showCustomOffsets && this.customDebut != null && this.customFin != null) {
      if (this.customDebut > this.customFin) {
        console.error("La date de début ne peut pas être supérieure à la date de fin.");
        this.isSubmitting = false;
        return;
      }
      offsetStart = this.customDebut;
      offsetEnd = this.customFin;
    } else {
      if (this.selectedWeeks.length === 0) {
        this.isSubmitting = false;
        return;
      }
      offsetStart = Math.min(...this.selectedWeeks.map(w => w.start));
      offsetEnd = Math.max(...this.selectedWeeks.map(w => w.end));
    }
    
    this.templatesService
      .assignNewTemplateMission(
        this.data.templateId,
        this.selectedMissionId,
        offsetStart,
        offsetEnd,
        this.selectedMissionType ?? MISSION_TYPE.CLASSIQUE,
        this.rang
      )
      .subscribe({
        next: () => {
          this.notificationService.success(SUCCESS_MSGS.MISSION_ASSIGN_SUCCESS);
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.notificationService.error(ERROR_MSGS.MISSION_ASSIGN_FAILED, err);
          this.isSubmitting = false;
        },
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
    return NewTemplateMissionDialogComponent.displayMissionFn;
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
}
