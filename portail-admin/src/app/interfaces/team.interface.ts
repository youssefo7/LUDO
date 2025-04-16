export interface Team {
  BANNIERE: string;
  IMAGE: string;
  NOM: string;
  DEFI: string;
  POINTS_ACTIFS: number;
  POINTS_BONUS: number;
  POINTS_TOTAL: number;
  POINTS_SEMAINE_ACTIF: number;
  POINTS_SEMAINE_BONUS: number;
  POINT_SEMAINE_TOTAL: number;
  SLOGAN: string;
  USER_COUNT?: number;
  _id?: string;
}

export interface CreateTeamInterface {
  BANNIERE: string;
  IMAGE: string;
  NOM: string;
  DEFI: string;
  SLOGAN: string;
}

export interface CreateTeamResponse {
  id: string;
}

export enum PointsType {
  ACTIVE = '🔥 Points actifs',
  BONUS = '💙 Points bonus',
  TOTAL = '🏆 Points totaux',
}

export enum IntervalType {
  WEEK = 'Semaine',
  GLOBAL = 'Global',
}

export enum TabLeaderboard {
  TEAM = 1,
  USER = 0,
}
