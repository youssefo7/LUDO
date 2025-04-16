import { Injectable } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { forkJoin, map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_WF_URL } from '../../constants/app.constants';
import { BubbleApiService } from '../api/bubble-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  users!: User[];

  constructor(
    private http: HttpClient,
    private bubbleService: BubbleApiService,
  ) {}

  async getDefiParticipantsWithStats(
    defiId: string,
  ): Promise<User[]> {
    const params = new HttpParams().set('DEFI', defiId);

    const response = await this.bubbleService.fetchAllWorkflowPaginated<string>(
      'get_users_by_defi',
      params,
    );

    this.users = response.response.results.map((entry) => JSON.parse(entry) as User);
    return this.users;
  }

  public fetchUserMissionAndActivityCounts(
    userId: string,
    defiId: string,
    start: Date,
    end: Date,
  ): Observable<{ missionCount: number; activityCount: number }> {
    return forkJoin({
      missionCount: this.http.get<{ response: { METRIC: number } }>(
        `${API_WF_URL}/get_user_mission_count?USER=${userId}&DEFI=${defiId}&START_DATE=${start.toISOString()}&END_DATE=${end.toISOString()}`,
      ),
      activityCount: this.http.get<{ response: { METRIC: number } }>(
        `${API_WF_URL}/get_user_activity_count?USER=${userId}&DEFI=${defiId}&START_DATE=${start.toISOString()}&END_DATE=${end.toISOString()}`,
      ),
    }).pipe(
      map(({ missionCount, activityCount }) => ({
        missionCount: missionCount?.response.METRIC || 0,
        activityCount: activityCount?.response.METRIC || 0,
      })),
    );
  }
}
