import { Injectable } from '@angular/core';
import { CreateTeamInterface, Team } from '../../interfaces/team.interface';
import {
  BehaviorSubject,
  catchError,
  firstValueFrom,
  map,
  Observable,
  throwError,
} from 'rxjs';
import { BubbleApiService } from '../api/bubble-api.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import {
  TeamSeparationApiResponse,
  TeamSeparationPayload,
} from '../../interfaces/api-response.interface';
import {
  API_BASE_URL,
  AUTOMATION_API_URL,
} from '../../constants/app.constants';
import { User } from '../../interfaces/user.interface';
import { AuthService } from '../api/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly apiUrl = API_BASE_URL;

  private readonly teamsSubject = new BehaviorSubject<Team[]>([]);
  teams$ = this.teamsSubject.asObservable();

  private readonly automationApiUrl = AUTOMATION_API_URL;

  constructor(
    private readonly http: HttpClient,
    private readonly bubbleService: BubbleApiService,
    private readonly authService: AuthService,
  ) {}

  async fetchTeams(defiId: string) {
    const params = new HttpParams().set('DEFI', defiId);
    const response = await this.bubbleService.fetchAllWorkflowPaginated<string>(
      'get_teams_by_defi',
      params,
    );
    const teams = response.response.results.map((user) => JSON.parse(user)) as Team[];
    this.teamsSubject.next(teams);
  }

  get teams(): Team[] {
    return this.teamsSubject.value;
  }

  removeTeam(teamId: string) {
    const updatedTeams = this.teamsSubject
      .getValue()
      .filter((t) => t._id !== teamId);
    this.teamsSubject.next(updatedTeams);
  }

  createTeam(team: CreateTeamInterface): Observable<void> {
    const params = new HttpParams()
      .set('NOM', team.NOM)
      .set('IMAGE', team.IMAGE)
      .set('BANNIERE', team.BANNIERE)
      .set('SLOGAN', team.SLOGAN)
      .set('DEFI', team.DEFI);

    return this.bubbleService
      .postWfApi<unknown>('create_team', params)
      .pipe(map(() => void 0));
  }

  getTeamSeparationProposition(
    defiId: string,
    maxUsersPerTeam?: number,
    maxTeams?: number,
    separateDepartments?: boolean,
  ): Observable<TeamSeparationPayload[]> {
    let params = new HttpParams().set('defiId', defiId);

    if (maxUsersPerTeam !== undefined) {
      params = params.set('maxUsersPerTeam', maxUsersPerTeam.toString());
    }
    if (maxTeams) {
      params = params.set('maxTeams', maxTeams.toString());
    }
    if (separateDepartments !== undefined) {
      params = params.set(
        'separateDepartments',
        separateDepartments.toString(),
      );
    }
    const token = this.authService.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    return this.http
      .get<TeamSeparationApiResponse>(
        `${this.automationApiUrl}/propose-team-separation`,
        { params, headers },
      )
      .pipe(
        map((response) =>
          response.team_assignments.map((team) => ({
            teamId: team.team_id,
            teamName: team.team_name,
            users: team.users.map((user) => ({
              userId: user.user_id,
              name: user.name ?? 'Nom inconnu Prénom inconnu',
              department: user.department ?? 'Inconnu',
              estimatedPts: user.estimated_pts ?? 0,
            })),
          })),
        ),
      );
  }

  confirmTeamSeparation(
    teamSeparation: TeamSeparationPayload[],
  ): Observable<void> {
    const transformedData = teamSeparation.reduce(
      (acc, team) => {
        acc[team.teamId] = team.users.map((user) => ({ user_id: user.userId }));
        return acc;
      },
      {} as Record<string, { user_id: string }[]>,
    );
    const token = this.authService.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    return this.http
      .post<void>(
        `${this.automationApiUrl}/confirm-team-separation`,
        transformedData,
        { headers },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error confirming team separation:', error);
          return throwError(
            () =>
              new Error('Failed to confirm team separation. Please try again.'),
          );
        }),
      );
  }
  async getTeamById(teamId: string): Promise<Team> {
    const existingTeam = this.teams.find((team) => team._id === teamId);
    if (existingTeam) {
      return existingTeam;
    }
    const fetchedTeam = (
      await firstValueFrom(
        this.bubbleService.fetchSingleApi(`equipe/${teamId}`),
      )
    ).response as Team;
    return fetchedTeam;
  }

  getTeamNameById(teamId: string): string {
    const team = this.teams.find((team) => team._id === teamId);
    return team ? team.NOM : '';
  }

  deleteTeam(teamId: string): Observable<void> {
    const params = new HttpParams().set('EQUIPE', teamId);

    return this.bubbleService.postWfApi<unknown>('delete_team', params).pipe(
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting team:', error);
        return throwError(
          () => new Error('Failed to delete team. Please try again.'),
        );
      }),
    );
  }

  removeUserFromTeam(userId: string, teamId: string): Observable<void> {
    const params = new HttpParams().set('USER', userId).set('EQUIPE', teamId);
    return this.bubbleService
      .postWfApi<unknown>('remove_user_from_team', params)
      .pipe(
        map(() => {
          const teams = this.teamsSubject.getValue();
          const team = teams.find((t) => t._id === teamId);
          if (team) {
            team.USER_COUNT = Math.max((team.USER_COUNT || 0) - 1, 0);
            this.teamsSubject.next(teams);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error removing user from team:', error);
          return throwError(
            () =>
              new Error('Failed to remove user from team. Please try again.'),
          );
        }),
      );
  }

  updateTeam(teamId: string, updatedTeam: Team) {
    const updatedTeamPayload = {
      NOM: updatedTeam.NOM,
      SLOGAN: updatedTeam.SLOGAN,
    };
    return this.http.patch<{ response: Team }>(
      `${this.apiUrl}/equipe/${teamId}`,
      updatedTeamPayload,
    );
  }

  addTeamMember(teamId: string, userId: string): Observable<void> {
    const params = new HttpParams().set('EQUIPE', teamId).set('USER', userId);
    return this.bubbleService
      .postWfApi<unknown>('add_user_to_team', params)
      .pipe(
        map(() => {
          const teams = this.teamsSubject.getValue();
          const team = teams.find((t) => t._id === teamId);
          if (team) {
            team.USER_COUNT = (team.USER_COUNT || 0) + 1;
            this.teamsSubject.next(teams);
          }
        }),
      );
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    const params = new HttpParams().set('TEAM', teamId);
    const response = await this.bubbleService.fetchAllWorkflowPaginated<string>(
      'get_users_by_team',
      params,
    );
    return response.response.results.map((user) => JSON.parse(user)) as User[];
  }

  async searchUsersWithoutTeamInDefi(defiId: string): Promise<User[]> {
    const params = new HttpParams().set('DEFI', defiId);
    const response = await this.bubbleService.fetchAllWorkflowPaginated<string>(
      'get_lonely_users',
      params,
    );
    return response.response.results.map((user) => JSON.parse(user)) as User[];
  }
}
