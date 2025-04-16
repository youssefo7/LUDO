/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { API_BASE_URL, API_WF_URL } from '../../constants/app.constants';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ApiResponse,
  SingleApiResponse,
} from '../../interfaces/api-response.interface';

const WORKFLOW_RETURN_LIMIT = 50;
const DATA_API_RETURN_LIMIT = 100;

@Injectable({
  providedIn: 'root',
})
export class BubbleApiService {
  private readonly apiUrl = API_BASE_URL;
  private readonly wfUrl = API_WF_URL;

  constructor(private readonly http: HttpClient) {}

  fetchDataApi<T>(
    endpoint: string,
    params?: HttpParams,
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, {
      params,
    });
  }

  async fetchAllDataApiPaginated<T>(
    endpoint: string,
    baseParams: HttpParams = new HttpParams(),
  ): Promise<T[]> {
    const allItems: T[] = [];
    let cursor = 0;
    const limit = DATA_API_RETURN_LIMIT;
    let hasMore = true;

    while (hasMore) {
      const pagedParams = baseParams.set('limit', limit).set('cursor', cursor);

      const res = await firstValueFrom(
        this.fetchDataApi<T>(endpoint, pagedParams),
      );
      const results = res.response.results;

      allItems.push(...results);

      if (results.length < limit) {
        hasMore = false;
      } else {
        cursor += limit;
      }
    }

    return allItems;
  }

  postDataApi<T>(
    endpoint: string,
    params?: HttpParams,
  ): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, params);
  }

  fetchSingleApi<T>(
    endpoint: string,
    params?: HttpParams,
  ): Observable<SingleApiResponse<T>> {
    return params
      ? this.http.get<SingleApiResponse<T>>(`${this.wfUrl}/${endpoint}`, {
          params,
        })
      : this.http.get<SingleApiResponse<T>>(`${this.apiUrl}/${endpoint}`);
  }

  postWfApi<T>(
    endpoint: string,
    params?: HttpParams,
  ): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.wfUrl}/${endpoint}`, params);
  }

  getWfApi<T>(
    endpoint: string,
    params?: HttpParams,
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.wfUrl}/${endpoint}`, {
      params,
    });
  }

  //IMPORTANT: when using this function, make sure the workflow handles input of limit and offset correctly or it will loop infinitely
  async fetchAllWorkflowPaginated<T>(
    endpoint: string,
    baseParams: HttpParams = new HttpParams(),
  ): Promise<ApiResponse<T>> {
    let res: ApiResponse<T> = {} as ApiResponse<T>;
    let offset = 1;
    let hasMore = true;
    let lastBatch = JSON.stringify([]);

    while (hasMore) {
      const pagedParams = baseParams.set('offset', offset);

      res = await firstValueFrom(this.getWfApi<T>(endpoint, pagedParams));
    
      const currentBatch = JSON.stringify(res.response.results);
      if (currentBatch === lastBatch) break; //to avoid infinite loop but its not fool proof, alternatively match ids but not all returns ids
      lastBatch = currentBatch;

      if (res.response.results.length < WORKFLOW_RETURN_LIMIT) {
        hasMore = false;
      } else {
        offset += WORKFLOW_RETURN_LIMIT;
      }
    }

    return res;
  }

  deleteMissionById(bubbleRecordId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/defis_mission/${bubbleRecordId}`,
    );
  }
}
