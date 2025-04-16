import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {
  Annonce,
} from '../../interfaces/announcement.interface';
import { BubbleApiService } from '../api/bubble-api.service';

@Injectable({
  providedIn: 'root',
})
export class AnnoncesService {
  private readonly _annonces$ = new BehaviorSubject<Annonce[]>([]);
  public annonces$ = this._annonces$.asObservable();

  constructor(
    private bubbleApiService: BubbleApiService
  ) {}

  async getAnnonces(defiId: string): Promise<Annonce[]> {
    const constraints = JSON.stringify([
      { key: 'DEFI', constraint_type: 'equals', value: defiId },
    ]);
    const params = new HttpParams().set('constraints', constraints);

    try {
      const response = (await firstValueFrom(this.bubbleApiService.fetchDataApi('annonce', params))).response.results;
      const raw = (response as Record<string, unknown>[]).map((item) => this.parseAnnonceFromApi(item));
      return this.sortAnnonces(raw);
    } catch(err) {
      console.error('Error loading annonces:', err);
      throw err;
    }
  }

  async createAnnonce(payload: Annonce): Promise<Annonce[]> {
    const params = new HttpParams()
    .set('DEFI', payload.DEFI)
    .set('DATE', payload.DATE.toISOString())
    .set('FR_TITRE', payload.FR_TITRE ?? '')
    .set('FR_SOUS_TITRE', payload.FR_SOUS_TITRE ?? '')
    .set('EN_TITRE', payload.EN_TITRE ?? '')
    .set('EN_SOUS_TITRE', payload.EN_SOUS_TITRE ?? '')
    .set('UTM_TAG', payload.UTM_TAG || '');
    const response = (await firstValueFrom(this.bubbleApiService.postWfApi('create_annonce', params))).response.results as Annonce[];
    response.map((item) => item.DATE = new Date(item.DATE));
    return this.sortAnnonces(response);
  }

  async updateAnnonce(payload: Annonce) {
    const params = new HttpParams()
    .set('DEFI', payload.DEFI)
    .set('DATE', payload.DATE.toISOString())
    .set('FR_TITRE', payload.FR_TITRE ?? '')
    .set('FR_SOUS_TITRE', payload.FR_SOUS_TITRE ?? '')
    .set('EN_TITRE', payload.EN_TITRE ?? '')
    .set('EN_SOUS_TITRE', payload.EN_SOUS_TITRE ?? '')
    .set('UTM_TAG', payload.UTM_TAG || '')
    .set('ANNONCE', payload._id || '');
    const response = (await firstValueFrom(this.bubbleApiService.postWfApi('update_annonce', params))).response.results as Annonce[];
    response.map((item) => item.DATE = new Date(item.DATE));
    return this.sortAnnonces(response);
  }

  async deleteAnnonceById(annonceId: string, defiId: string): Promise<Annonce[]> {
    const params = new HttpParams()
    .set('ANNONCE', annonceId)
    .set('DEFI', defiId);
    const response = (await firstValueFrom(this.bubbleApiService.postWfApi('delete_annonce', params))).response.results as Annonce[];
    response.map((item) => item.DATE = new Date(item.DATE));
    return this.sortAnnonces(response);
  }

  private parseAnnonceFromApi(item: Record<string, unknown>): Annonce {
    return {
      _id: item['_id'] as string,
      DEFI: (item['DEFI'] as string) || '',
      DATE: item['DATE'] ? new Date(item['DATE'] as string) : new Date(),
      'Created Date': item['Created Date']
        ? new Date(item['Created Date'] as string)
        : new Date(),
      FR_TITRE: (item['FR_TITRE'] as string) || '',
      FR_SOUS_TITRE: (item['FR_SOUS_TITRE'] as string) || '',
      EN_TITRE: (item['EN_TITRE'] as string) || '',
      EN_SOUS_TITRE: (item['EN_SOUS_TITRE'] as string) || '',
      UTM_TAG: (item['UTM_TAG'] as string) || '',
    } as Annonce;
  }

  private sortAnnonces(list: Annonce[]): Annonce[] {
    const now = new Date();
    return list.sort((a, b) => {
      const aUpcoming = a.DATE.getTime() > now.getTime();
      const bUpcoming = b.DATE.getTime() > now.getTime();
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      return a.DATE.getTime() - b.DATE.getTime();
    });
  }
}
