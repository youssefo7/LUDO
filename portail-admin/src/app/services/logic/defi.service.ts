import { Injectable } from '@angular/core';
import { Defi, TimeSlot } from '../../interfaces/defi.interface';
import { BubbleApiService } from '../api/bubble-api.service';
import {
  DefiTimeState,
  ONE_WEEK,
  PRIVATE_PLAN,
} from '../../constants/app.constants';
import {
  BehaviorSubject,
  catchError,
  firstValueFrom,
  map,
  Observable,
  throwError,
} from 'rxjs';
import { DefiStateService } from '../state/defi-state.service';
import { Entreprise } from '../../interfaces/entreprise-interface';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DefiService {
  currentDate = new Date();
  defiList: Defi[] = [];
  private readonly entrepriseListSubject = new BehaviorSubject<Entreprise[]>([]);
  entrepriseList$ = this.entrepriseListSubject.asObservable();
  selectedTimeSlots: DefiTimeState[] = [];

  constructor(
    private readonly defiStateService: DefiStateService,
    private readonly bubbleService: BubbleApiService,
  ) {}

  createDefi(
    nom: string,
    startDate: Date,
    endDate: Date,
    isEquipeLibre: boolean,
    templateId?: string,
    entrepriseId?: string,
    tailleEquipe?: number,
  ): Observable<void> {
    let params = new HttpParams()
      .set('NOM', nom)
      .set('DATE_DEBUT', startDate.toISOString())
      .set('DATE_FIN', endDate.toISOString())
      .set('IS_EQUIPE_LIBRE', isEquipeLibre)
      .set('PLAN', PRIVATE_PLAN)
      .set('ENTREPRISE', entrepriseId || '')
      .set('TAILLE_EQUIPE', tailleEquipe || 5);

    if (templateId && templateId.trim() !== '') {
      params = params.set('TEMPLATE', templateId);
    }
    return this.bubbleService
      .postWfApi<unknown>('create_defi', params)
      .pipe(map(() => void 0));
  }

  updateDefi(
    defiId: string,
    defiName: string,
    startDate: Date,
    endDate: Date,
  ): Observable<void> {
    const params = new HttpParams()
      .set('DEFI', defiId)
      .set('NOM', defiName)
      .set('DATE_DEBUT', startDate.toISOString())
      .set('DATE_FIN', endDate.toISOString());

    return this.bubbleService
      .postWfApi<unknown>('modify_defi', params)
      .pipe(map(() => void 0));
  }

  deleteDefi(defiId: string): Observable<void> {
    const params = new HttpParams().set('DEFI', defiId);
    return this.bubbleService
      .postWfApi<unknown>('delete_defi', params)
      .pipe(map(() => void 0));
  }

  async setDefi(defiId: string) {
    if (defiId) {
      const defi = (
        await firstValueFrom(
          this.bubbleService.fetchSingleApi(`defi/${defiId}`),
        )
      ).response as Defi;
      if (defi.DATE_DEBUT) {
        defi.DATE_DEBUT = new Date(defi.DATE_DEBUT);
      }
      if (defi.DATE_FIN) {
        defi.DATE_FIN = new Date(defi.DATE_FIN);
      }

      this.defiStateService.defi = defi;
      this.defiStateService.setTimeSlots(this.getDefiPhasesAsTimeSlots());
      this.setInitialTimeSlots();
      this.defiStateService.setDates(
        this.defiStateService.allTimeSlots.filter(
          (slot) => slot.LABEL === this.selectedTimeSlots[0],
        )[0].START_DATE,
        this.defiStateService.allTimeSlots.filter(
          (slot) =>
            slot.LABEL ===
            this.selectedTimeSlots[this.selectedTimeSlots.length - 1],
        )[0].END_DATE,
      );
    } else {
      this.defiStateService.setDates(
        new Date(this.currentDate.getTime() - 4 * ONE_WEEK),
        this.currentDate,
      );
    }
  }

  async getDefi(defiId: string): Promise<Defi> {
    const existingDefi = this.defiList.find((defi) => defi._id === defiId);
    if (existingDefi) {
      return existingDefi;
    }
    const fetchedDefi = (
      await firstValueFrom(this.bubbleService.fetchSingleApi(`defi/${defiId}`))
    ).response as Defi;
    this.defiList.push(fetchedDefi);
    return fetchedDefi;
  }

  async fetchAllDefis() {
    this.defiList =
      await this.bubbleService.fetchAllDataApiPaginated<Defi>('defi');
  }

  setInitialTimeSlots(): void {
    const defi = this.defiStateService.defi;

    if (!defi || !defi.DATE_DEBUT || !defi.DATE_FIN) {
      this.selectedTimeSlots = [];
      return;
    }

    if (this.currentDate > defi.DATE_FIN) {
      this.selectedTimeSlots = [
        DefiTimeState.SEMAINE_1,
        DefiTimeState.SEMAINE_2,
        DefiTimeState.SEMAINE_3,
        DefiTimeState.SEMAINE_4,
      ];
      return;
    }

    for (const slot of this.defiStateService.allTimeSlots) {
      if (
        this.currentDate >= slot.START_DATE &&
        this.currentDate <= slot.END_DATE
      ) {
        this.selectedTimeSlots = [slot.LABEL];
        return;
      }
    }

    this.selectedTimeSlots = [DefiTimeState.PRE_DEFI];
  }

  confirmTimeSlots(startDate: Date, endDate: Date): void {
    const defi = this.defiStateService.defi;
    if (!defi || !defi.DATE_DEBUT || !defi.DATE_FIN) {
      this.selectedTimeSlots = [DefiTimeState.DEFAULT];
      return;
    }

    const matchedSlots: DefiTimeState[] = [];

    for (const slot of this.defiStateService.allTimeSlots) {
      if (startDate <= slot.END_DATE && endDate >= slot.START_DATE) {
        matchedSlots.push(slot.LABEL);
      }
    }

    if (
      matchedSlots.length === 0 ||
      !this.isSelectionContiguous(
        matchedSlots,
        this.defiStateService.allTimeSlots.map((slot) => slot.LABEL),
      )
    ) {
      this.selectedTimeSlots = [DefiTimeState.DEFAULT];
    } else {
      this.selectedTimeSlots = matchedSlots;
    }
    this.defiStateService.setDates(startDate, endDate);
  }

  private getDefiPhasesAsTimeSlots(): TimeSlot[] {
    const defi = this.defiStateService.defi;
    if (!defi || !defi.DATE_DEBUT || !defi.DATE_FIN) {
      return [];
    }

    const startDate = new Date(defi.DATE_DEBUT);
    const endDate = new Date(defi.DATE_FIN);

    const timeSlots: TimeSlot[] = [
      {
        LABEL: DefiTimeState.PRE_DEFI,
        START_DATE: new Date(startDate.getTime() - 8 * ONE_WEEK), //2 months before start date
        END_DATE: new Date(startDate.getTime() - 1),
      },
    ];

    for (let i = 1; i <= 3; i++) {
      const weekStart = new Date(startDate.getTime() + (i - 1) * ONE_WEEK);
      const weekEnd = new Date(weekStart.getTime() + ONE_WEEK - 100);
      timeSlots.push({
        LABEL: DefiTimeState[`SEMAINE_${i}` as keyof typeof DefiTimeState],
        START_DATE: weekStart,
        END_DATE: weekEnd,
      });
    }

    const week4Start = new Date(startDate.getTime() + 3 * ONE_WEEK);
    timeSlots.push({
      LABEL: DefiTimeState.SEMAINE_4,
      START_DATE: week4Start,
      END_DATE: new Date(endDate.getTime()),
    });
    timeSlots.push({
      LABEL: DefiTimeState.APRES_DEFI,
      START_DATE: new Date(endDate.getTime() + 1),
      END_DATE: new Date(endDate.getTime() + 2 * ONE_WEEK),
    });

    return timeSlots;
  }

  private isSelectionContiguous(
    selectedSlots: DefiTimeState[],
    predefinedSlots: DefiTimeState[],
  ): boolean {
    const selectedIndices = selectedSlots
      .map((slot) => predefinedSlots.findIndex((s) => s === slot))
      .sort((a, b) => a - b);

    for (let i = 1; i < selectedIndices.length; i++) {
      if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
        return false;
      }
    }

    return true;
  }

  getStatusClass(defi: Defi): { statusText: string; statusClass: string } {
    if (!defi)
      return {
        statusText: DefiTimeState.DEFAULT,
        statusClass: 'status en-cours',
      };

    const startDate = new Date(defi.DATE_DEBUT);
    const endDate = new Date(defi.DATE_FIN);

    if (startDate <= this.currentDate && endDate >= this.currentDate) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const currentDate = new Date();

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const current = new Date(currentDate);
      current.setHours(0, 0, 0, 0);

      const diffWeeks =
        Math.floor((current.getTime() - start.getTime()) / oneWeek) + 1;

      if (diffWeeks >= 1 && diffWeeks <= 4) {
        return {
          statusText: `Semaine ${diffWeeks}`,
          statusClass: 'status en-cours',
        };
      }
      return {
        statusText: DefiTimeState.DEFAULT,
        statusClass: 'status en-cours',
      };
    } else if (startDate > this.currentDate) {
      return {
        statusText: DefiTimeState.EN_ATTENTE,
        statusClass: 'status en-attente',
      };
    } else if (endDate < this.currentDate) {
      return {
        statusText: DefiTimeState.TERMINÉ,
        statusClass: 'status termine',
      };
    } else {
      return { statusText: DefiTimeState.DEFAULT, statusClass: 'status' };
    }
  }

  async fetchEntreprises(): Promise<void> {
    const entreprises =
      await this.bubbleService.fetchAllDataApiPaginated<Entreprise>(
        'entreprise',
      );
    this.entrepriseListSubject.next(entreprises);
  }

  getEntrepriseNameById(entrepriseId: string): string {
    const entreprise = this.entrepriseListSubject
      .getValue()
      .find((e) => e._id === entrepriseId);
    return entreprise ? entreprise.NOM : '';
  }

  async createEntreprise(nom: string) {
    const params = new HttpParams().set('NOM', nom).set('TYPE', 'Client');
    await firstValueFrom(this.bubbleService.postDataApi(`entreprise`, params));
    this.fetchEntreprises();
  }

  removeUserFromDefi(userId: string, defiId: string): Observable<void> {
    const params = new HttpParams().set('USER', userId).set('DEFI', defiId);
    return this.bubbleService.postWfApi('remove_user_from_defi', params).pipe(
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        console.error('Error removing user from defi:', error);
        return throwError(
          () =>
            new Error('Failed to removing user from defi. Please try again.'),
        );
      }),
    );
  }
}
