import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Defi, TimeSlot } from '../../interfaces/defi.interface';
import { Entreprise } from '../../interfaces/entreprise-interface';

@Injectable({
  providedIn: 'root',
})
export class DefiStateService {
  private allTimeSlotsData: TimeSlot[] = [];
  private defiSubject = new BehaviorSubject<Defi | null>(null);
  private datesSubject = new BehaviorSubject<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  private entrepriseSubject = new BehaviorSubject<Entreprise | null>(null);

  defi$ = this.defiSubject.asObservable();
  dates$ = this.datesSubject.asObservable();
  entreprises$ = this.entrepriseSubject.asObservable();

  get dates(): { start: Date | null; end: Date | null } {
    return this.datesSubject.getValue();
  }
  set defi(defi: Defi) {
    this.defiSubject.next(defi);
  }

  get defi(): Defi | null {
    return this.defiSubject.getValue();
  }

  set entreprises(entreprise: Entreprise) {
    this.entrepriseSubject.next(entreprise);
  }

  get entreprise(): Entreprise | null {
    return this.entrepriseSubject.getValue();
  }

  get defiId(): string | undefined {
    return this.defiSubject.getValue()?._id;
  }

  setDates(start: Date, end: Date) {
    this.datesSubject.next({ start, end });
  }

  setTimeSlots(timeSlots: TimeSlot[]) {
    this.allTimeSlotsData = timeSlots;
  }

  get allTimeSlots(): TimeSlot[] {
    return this.allTimeSlotsData;
  }

  get startDate(): Date | null {
    return this.datesSubject.getValue().start;
  }

  get endDate(): Date | null {
    return this.datesSubject.getValue().end;
  }
}
