import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  MissionClassique,
  MISSION_TYPE,
  DefiMission,
  MissionMilestone,
  MissionBundle,
  MissionCacheKey,
} from '../../interfaces/missions.interface';
import { BubbleApiService } from '../api/bubble-api.service';
import { HttpParams } from '@angular/common/http';

import { TimeSlot } from '../../interfaces/defi.interface';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class MissionService {
  missionCache = new Map<MissionCacheKey, DefiMission[]>();
  defiMissions: DefiMission[] = [];
  missionsClassiques: MissionClassique[] = [];
  missionsMilestones: MissionMilestone[] = [];
  missionsBundles: MissionBundle[] = [];

  constructor(private bubbleApiService: BubbleApiService) {}

  cleanAndParseMissions(
    rawResults: string[],
    userCount: number,
  ): DefiMission[] {
    return rawResults.map((entry) => {
      const parsed = JSON.parse(entry);

      parsed[parsed.MISSION_TYPE] = JSON.parse(parsed[parsed.MISSION_TYPE]);
      const source = parsed[parsed.MISSION_TYPE];
      parsed.IMAGE = source.IMAGE;
      parsed.TITRE_EN = source.TITRE_EN;
      parsed.TITRE_FR = source.TITRE_FR;
      parsed.DESCR_APERCU_FR = source.DESCR_APERCU_FR;
      parsed.DESCR_APERCU_EN = source.DESCR_APERCU_EN;
      parsed.POINTS = source.POINTS;
      parsed.MISSION_ID = source.MISSION_ID;
      parsed.DATE_DEBUT = parsed.DATE_DEBUT
        ? new Date(parsed.DATE_DEBUT)
        : new Date();
      parsed.DATE_FIN = parsed.DATE_FIN
        ? new Date(parsed.DATE_FIN)
        : new Date();

      const completionKey = `${parsed.MISSION_TYPE}_COMPLETION`;
      parsed.COMPLETION = parsed[completionKey] ?? 0;
      parsed.TAUX_COMPLETION = parseFloat(
        ((parsed.COMPLETION / userCount) * 100).toFixed(2),
      );
      return parsed as DefiMission;
    });
  }

  async getMissionsByDefiId(defiId: string, startDate: Date, endDate: Date): Promise<DefiMission[]> {
    const extendedStartDate = new Date(startDate);
    extendedStartDate.setDate(extendedStartDate.getDate() - 14);
    const extendedEndDate = new Date(endDate);
    extendedEndDate.setDate(extendedEndDate.getDate() + 14);

    const params = new HttpParams()
      .set('DEFI', defiId)
      .set('START_DATE', extendedStartDate.toISOString())
      .set('END_DATE', extendedEndDate.toISOString());

    const response =
      (await this.bubbleApiService.fetchAllWorkflowPaginated<string>(
        'get_defis_missions_with_completion',
        params,
      )
    );
    const userCount = response.response.user_count ?? 0;
    this.defiMissions = this.cleanAndParseMissions(
      response.response.results as string[],
      userCount,
    );

    return this.defiMissions.sort((a, b) => {
      const startA = a.DATE_DEBUT?.getTime() ?? 0;
      const startB = b.DATE_DEBUT?.getTime() ?? 0;

      if (startA !== startB) {
        return startA - startB;
      }

      const endA = a.DATE_FIN?.getTime() ?? 0;
      const endB = b.DATE_FIN?.getTime() ?? 0;

      return endA - endB;
    });
  }

  async fetchMissions(missionType: MISSION_TYPE) {
    switch (missionType) {
      case MISSION_TYPE.CLASSIQUE:
        this.fetchClassiques();
        break;
      case MISSION_TYPE.MILESTONE:
        this.fetchMilestones();
        break;
      case MISSION_TYPE.BUNDLE:
        this.fetchBundles();
        break;
    }
  }

  assignNewMission(
    defiId: string,
    selectedMissionId: string,
    startDate: Date,
    endDate: Date,
    type: MISSION_TYPE,
    rang: number,
  ) {
    const params = new HttpParams()
      .set('DEFI', defiId)
      .set('MISSION_TYPE', type)
      .set('DATE_DEBUT', startDate.toISOString())
      .set('DATE_FIN', endDate.toISOString())
      .set('RANG', rang ? rang : 4)
      .set('MISSION_ID', selectedMissionId);

    return this.bubbleApiService.postWfApi('defis_mission', params);
  }

  async updateMission(
    id: string,
    startDate: Date,
    endDate: Date,
    rang: number,
  ): Promise<DefiMission> {
    const params = new HttpParams()
      .set('_id', id)
      .set('RANG', rang ? rang : 4)
      .set('DATE_DEBUT', startDate.toISOString())
      .set('DATE_FIN', endDate.toISOString());
    return (
      await firstValueFrom(
        this.bubbleApiService.postWfApi('update_defis_mission', params),
      )
    ).response.results as unknown as DefiMission;
  }

  deleteMission(id: string): Observable<void> {
    return this.bubbleApiService.deleteMissionById(id);
  }

  private async fetchClassiques() {
    if (this.missionsClassiques.length === 0) {
      const response =
        await this.bubbleApiService.fetchAllWorkflowPaginated<string>(
          'mission_by_type',
          new HttpParams().set('MISSION_TYPE', MISSION_TYPE.CLASSIQUE),
        );

      this.missionsClassiques = response.response.results.map((entry) =>
        JSON.parse(entry),
      ) as MissionClassique[];
    }
  }

  private async fetchMilestones() {
    if (this.missionsMilestones.length === 0) {
      const response =
        await this.bubbleApiService.fetchAllWorkflowPaginated<string>(
          'mission_by_type',
          new HttpParams().set('MISSION_TYPE', MISSION_TYPE.MILESTONE),
        );

      this.missionsMilestones = response.response.results.map((entry) =>
        JSON.parse(entry),
      ) as MissionMilestone[];
    }
  }

  private async fetchBundles() {
    if (this.missionsBundles.length === 0) {
      const response =
        await this.bubbleApiService.fetchAllWorkflowPaginated<string>(
          'mission_by_type',
          new HttpParams().set('MISSION_TYPE', MISSION_TYPE.BUNDLE),
        );

      this.missionsBundles = response.response.results.map((entry) =>
        JSON.parse(entry),
      ) as MissionBundle[];
    }
  }

  togglePhaseSelection(
    phase: TimeSlot,
    selectedPhases: TimeSlot[],
    allTimeSlots: TimeSlot[],
  ): TimeSlot[] {
    const index = allTimeSlots.indexOf(phase);
    const selectedIndices = selectedPhases.map((p) => allTimeSlots.indexOf(p));
    let updatedPhases = [...selectedPhases];

    if (selectedPhases.includes(phase)) {
      updatedPhases = selectedPhases.filter((p) => p !== phase);
    } else {
      const minSelected = Math.min(...selectedIndices, index);
      const maxSelected = Math.max(...selectedIndices, index);
      const isConsecutive = allTimeSlots
        .slice(minSelected, maxSelected + 1)
        .every((p) => selectedPhases.includes(p) || p === phase);

      if (isConsecutive) {
        updatedPhases.push(phase);
      } else {
        updatedPhases = [phase];
      }
    }

    return updatedPhases.sort(
      (a, b) => allTimeSlots.indexOf(a) - allTimeSlots.indexOf(b),
    );
  }

  updateDateRangeFromPhases(
    selectedPhases: TimeSlot[],
    rangeGroup: FormGroup,
  ): { startDate: Date; endDate: Date } | null {
    if (selectedPhases.length === 0) {
      return null;
    }

    const startDate = new Date(
      Math.min(...selectedPhases.map((p) => p.START_DATE.getTime())),
    );
    const endDate = new Date(
      Math.max(...selectedPhases.map((p) => p.END_DATE.getTime())),
    );

    rangeGroup.controls['start'].setValue(startDate, { emitEvent: false });
    rangeGroup.controls['end'].setValue(endDate, { emitEvent: false });

    return { startDate, endDate };
  }

  getPhasesByDateRange(
    startDate: Date,
    endDate: Date,
    allTimeSlots: TimeSlot[],
  ): TimeSlot[] {
    return allTimeSlots.filter(
      (slot) => slot.START_DATE >= startDate && slot.END_DATE <= endDate,
    );
  }

  formatRangValue(rang: string | number): number {
    const rangValue = typeof rang === 'string' ? parseInt(rang, 10) : rang;
    return isNaN(rangValue) ? 1 : rangValue;
  }
}
