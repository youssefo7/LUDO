import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  of,
  switchMap,
  firstValueFrom,
  BehaviorSubject,
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  API_WF_URL,
  API_BASE_URL,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
} from '../../constants/app.constants';
import {
  LoginRequest,
  LoginResponse,
  UserResponse,
} from '../../interfaces/auth.interface';
import {
  ApiResponse,
  Permission,
} from '../../interfaces/api-response.interface';
import { DefiService } from '../logic/defi.service';
import { Router } from '@angular/router';
import { NotificationService } from './../state/notification.service';
import { ERROR_MSGS } from '../../constants/error-msg.constant';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly wfUrl = API_WF_URL;
  private readonly apiUrl = API_BASE_URL;

  private readonly cachedPermissions$ = new BehaviorSubject<{
    roles: string[];
    organisations: string[];
    defis: string[];
  } | null>(null);

  constructor(
    private readonly http: HttpClient,
    protected defiService: DefiService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
  ) {}

  login(
    email: string,
    password: string,
  ): Observable<{ success: boolean; message?: string }> {
    const payload: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.wfUrl}/login`, payload).pipe(
      switchMap((response) => {
        if (response.status === 'success' && response.response?.user_id) {
          this.storeUserData(response.response);
          this.cachedPermissions$.next(null);
          return this.fetchUserPermissions(
            response.response.user_id,
            true,
          ).pipe(
            switchMap(({ roles }) => {
              const hasAccess = roles.some((role) =>
                [ADMIN_ROLE, SUPER_ADMIN_ROLE].includes(role),
              );
              if (hasAccess) {
                return of({ success: true });
              } else {
                this.logout();
                return of({
                  success: false,
                  message: 'Accès refusé: Vous devez être un administrateur.',
                });
              }
            }),
          );
        } else {
          return of({
            success: false,
            message: 'Identifiants incorrects. Veuillez réessayer.',
          });
        }
      }),
      catchError(() => {
        return of({
          success: false,
          message: 'Erreur de connexion. Veuillez réessayer.',
        });
      }),
    );
  }

  private storeUserData(response: UserResponse): void {
    sessionStorage.setItem('authToken', response.token);
    sessionStorage.setItem('userId', response.user_id);
  }

  public getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  async isAuthenticated(): Promise<boolean> {
    return !!this.getToken();
  }

  public async isSuperAdmin(): Promise<boolean> {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return false;

    // Always clear and fetch fresh permissions
    this.cachedPermissions$.next(null);
    const { roles } = await firstValueFrom(
      this.fetchUserPermissions(userId, false),
    );
    return roles.includes(SUPER_ADMIN_ROLE);
  }

  public async canAccessOrganisation(organisationId: string): Promise<boolean> {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return false;

    const { roles, organisations } = await firstValueFrom(
      this.fetchUserPermissions(userId, false),
    );
    return (
      roles.includes(SUPER_ADMIN_ROLE) || organisations.includes(organisationId)
    );
  }

  public async canAccessDefi(defiId: string): Promise<boolean> {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return false;

    const { roles, defis, organisations } = await firstValueFrom(
      this.fetchUserPermissions(userId, false),
    );

    if (roles.includes(SUPER_ADMIN_ROLE) || defis.includes(defiId)) {
      return true;
    }

    const entrepriseId = await this.getEntrepriseIdForDefi(defiId);
    return entrepriseId ? organisations.includes(entrepriseId) : false;
  }

  private async getEntrepriseIdForDefi(defiId: string): Promise<string | null> {
    const defi = await this.defiService.getDefi(defiId);
    return defi?.ENTREPRISE || null;
  }

  /**
   * Fetches user permissions from backend.
   */
  private fetchUserPermissions(
    userId: string,
    setRoleOnFetch: boolean,
  ): Observable<{
    roles: string[];
    organisations: string[];
    defis: string[];
  }> {
    // If already cached, return it
    if (this.cachedPermissions$.value !== null) {
      return of(this.cachedPermissions$.value);
    }

    const constraints = JSON.stringify([
      { key: 'USER', constraint_type: 'equals', value: userId },
    ]);

    return this.http
      .get<ApiResponse<Permission>>(`${this.apiUrl}/user_permission`, {
        params: { constraints },
      })
      .pipe(
        map((response) => {
          const roles = new Set<string>();
          const organisations: string[] = [];
          const defis: string[] = [];

          if (response?.response?.results?.length) {
            for (const perm of response.response.results) {
              if (perm.ROLE) roles.add(perm.ROLE);
              if (perm.ENTITY_TYPE === 'ORGANISATION') {
                organisations.push(perm.ENTITY_ID);
              } else if (perm.ENTITY_TYPE === 'DEFI') {
                defis.push(perm.ENTITY_ID);
              }
            }

            let assignedRole = '';
            if (roles.has(SUPER_ADMIN_ROLE)) {
              assignedRole = SUPER_ADMIN_ROLE;
            } else if (roles.has(ADMIN_ROLE)) {
              assignedRole = ADMIN_ROLE;
            }

            if (assignedRole && setRoleOnFetch) {
              this.http
                .post(`${this.wfUrl}/set_role`, { role: assignedRole })
                .pipe(
                  catchError((err) => {
                    this.notificationService.info(
                      `Erreur lors de la mise à jour du rôle: ${err}`,
                    );
                    return of(null);
                  }),
                )
                .subscribe();
            }
          }

          const permissions = {
            roles: Array.from(roles),
            organisations,
            defis,
          };

          this.cachedPermissions$.next(permissions);

          return permissions;
        }),
        catchError((error) => {
          this.notificationService.error(
            ERROR_MSGS.PERMISSION_FETCH_ERROR,
            error,
          );
          return of({
            roles: [],
            organisations: [],
            defis: [],
          });
        }),
      );
  }
}
