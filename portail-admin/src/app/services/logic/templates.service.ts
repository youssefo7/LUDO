import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../constants/app.constants';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Template,
  TemplateMission,
  TemplateAnnonce,
} from '../../interfaces/template.interface';
import {
  ApiResponse,
  SingleApiResponse,
} from '../../interfaces/api-response.interface';
import { BubbleApiService } from '../api/bubble-api.service';
import { FormControl, FormGroup } from '@angular/forms';
import { MISSION_TYPE } from '../../interfaces/missions.interface';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  private _templateAnnonces$ = new BehaviorSubject<TemplateAnnonce[]>([]);
  public templateAnnonces$ = this._templateAnnonces$.asObservable();
  private readonly apiUrl = API_BASE_URL;

  templateMissions: TemplateMission[] = [];

  range = new FormGroup({
    start: new FormControl<Date | null>(new Date(2025, 2, 1)),
    end: new FormControl<Date | null>(new Date()),
  });

  constructor(
    private readonly http: HttpClient,
    private readonly bubbleApiService: BubbleApiService,
  ) {}

  getTemplatesbyId(templateId: string): Observable<Template> {
    return this.http
      .get<SingleApiResponse<Template>>(`${this.apiUrl}/template/${templateId}`)
      .pipe(
        map((response) => {
          const template = response.response;
          return {
            ...template,
            Created_Date: new Date(template['Created Date']),
          };
        }),
      );
  }

  cleanAndParseMissions(rawResults: string[]): TemplateMission[] {
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

      return parsed as TemplateMission;
    });
  }

  async getTemplateMissionsById(templateId: string) {
    const params = new HttpParams().set('TEMPLATE', templateId);

    const results =
      (await this.bubbleApiService.fetchAllWorkflowPaginated<string>(
        'get_template_mission',
        params,
      )).response.results as string[];

    const missions = this.cleanAndParseMissions(results);

    // Sort the missions by OFFSET_DEBUT and OFFSET_FIN
    this.templateMissions = missions.sort((a, b) => {
      const startA = a.OFFSET_DEBUT ?? 0;
      const startB = b.OFFSET_DEBUT ?? 0;

      if (startA !== startB) {
        return startA - startB;
      }

      const endA = a.OFFSET_FIN ?? 0;
      const endB = b.OFFSET_FIN ?? 0;

      return endA - endB;
    });
  }

  async getTemplateAnnonces(templateId: string): Promise<TemplateAnnonce[]> {
    const httpParams = new HttpParams().set('TEMPLATE', templateId);
    try {
      const response =
        await this.bubbleApiService.fetchAllWorkflowPaginated<TemplateAnnonce>(
          'get_template_annonces',
          httpParams,
        );
      response.response.results.forEach((item) => {
        item.HEURE = item.HEURE ?? 12;
        item.MIN = item.MIN ?? 0;
        item.JOUR = item.JOUR ?? 0;
      });
      return response.response.results;
    } catch (err) {
      console.error('Error loading template annonces:', err);
      throwError(() => err);
      return [];
    }
  }

  getAllTemplates(): Observable<ApiResponse<Template>> {
    return this.http.get<ApiResponse<Template>>(`${this.apiUrl}/template`);
    // TODO: fetch with pagination
  }

  createTemplate(template: Partial<Template>): Observable<Template> {
    return this.http
      .post<SingleApiResponse<Template>>(`${this.apiUrl}/template`, template)
      .pipe(
        map((response) => {
          const createdTemplate = response.response;
          return {
            ...createdTemplate,
          };
        }),
      );
  }

  assignNewTemplateMission(
    templateId: string,
    selectedMissionId: string,
    offsetStart: number,
    offsetEnd: number,
    type: MISSION_TYPE,
    rang: number,
  ) {
    const params = new HttpParams()
      .set('TEMPLATE', templateId)
      .set('MISSION_TYPE', type)
      .set('OFFSET_DEBUT', offsetStart)
      .set('OFFSET_FIN', offsetEnd)
      .set('RANG', rang)
      .set('MISSION_ID', selectedMissionId);

    return this.bubbleApiService.postWfApi('template_mission', params);
  }

  async createTemplateAnnonce(
    payload: TemplateAnnonce,
  ): Promise<TemplateAnnonce[]> {
    const params = new HttpParams()
      .set('TEMPLATE', payload.TEMPLATE)
      .set('JOUR', payload.JOUR.toString())
      .set('FR_TITRE', payload.FR_TITRE ?? '')
      .set('FR_SOUS_TITRE', payload.FR_SOUS_TITRE ?? '')
      .set('EN_SOUS_TITRE', payload.EN_SOUS_TITRE ?? '')
      .set('EN_TITRE', payload.EN_TITRE ?? '')
      .set('HEURE', payload.HEURE ?? 0)
      .set('MIN', payload.MIN ?? 0)
      .set('UTM_TAG', payload.UTM_TAG ?? '');

    const response = (
      await firstValueFrom(
        this.bubbleApiService.postWfApi('create_template_annonce', params),
      )
    ).response.results as TemplateAnnonce[];
    response.map((item: TemplateAnnonce) => {
      item.HEURE = item.HEURE ?? 12;
      item.MIN = item.MIN ?? 0;
      item.JOUR = item.JOUR ?? 0;
    });
    return response;
  }

  async updateTemplateMission(
    templateId: string,
    offsetStart: number,
    offsetEnd: number,
    rang: number,
  ) {
    const params = new HttpParams()
      .set('TEMPLATE_ID', templateId)
      .set('RANG', rang.toString())
      .set('OFFSET_DEBUT', offsetStart.toString())
      .set('OFFSET_FIN', offsetEnd.toString());

    await firstValueFrom(
      this.bubbleApiService.postWfApi('update_template_mission', params),
    );
  }

  deleteTemplateMission(missionId: string) {
    return this.http.delete(`${this.apiUrl}/TEMPLATE_MISSION/${missionId}`);
  }

  deleteTemplate(templateId: string): Observable<void> {
    const params = new HttpParams().set('TEMPLATE_ID', templateId);
    return this.bubbleApiService
      .postWfApi<unknown>('DELETE_TEMPLATE', params)
      .pipe(map(() => void 0));
  }

  async deleteTemplatesAnnonce(
    templateAnnonceId: TemplateAnnonce,
  ): Promise<TemplateAnnonce[]> {
    const params = new HttpParams()
      .set('_id', templateAnnonceId._id ?? '')
      .set('TEMPLATE', templateAnnonceId.TEMPLATE ?? '');
    return (
      await firstValueFrom(
        this.bubbleApiService.postWfApi('delete_template_annonce', params),
      )
    ).response.results as TemplateAnnonce[];
  }

  async updateTemplatesAnnonce(
    payload: TemplateAnnonce,
  ): Promise<TemplateAnnonce[]> {
    const params = new HttpParams()
      .set('JOUR', (payload.JOUR ?? 0).toString())
      .set('FR_TITRE', payload.FR_TITRE ?? '')
      .set('FR_SOUS_TITRE', payload.FR_SOUS_TITRE ?? '')
      .set('EN_TITRE', payload.EN_TITRE ?? '')
      .set('EN_SOUS_TITRE', payload.EN_SOUS_TITRE ?? '')
      .set('UTM_TAG', payload.UTM_TAG)
      .set('TEMPLATE', payload.TEMPLATE ?? '')
      .set('HEURE', payload.HEURE ?? 0)
      .set('MIN', payload.MIN ?? 0)
      .set('UTM_TAG', payload.UTM_TAG ?? '')
      .set('_id', payload._id ?? '');
    const response = (
      await firstValueFrom(
        this.bubbleApiService.postWfApi('update_template_annonce', params),
      )
    ).response.results as TemplateAnnonce[];
    response.map((item: TemplateAnnonce) => {
      item.HEURE = item.HEURE ?? 12;
      item.MIN = item.MIN ?? 0;
      item.JOUR = item.JOUR ?? 0;
    });
    return response;
  }
}
