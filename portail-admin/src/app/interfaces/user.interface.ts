import { Defi } from './defi.interface';
import { Team } from './team.interface';

export interface UserEquipe {
  USER: string;
  EQUIPE: string;
  _id: string;
}

export interface User {
  _id: string;
  PRENOM: string;
  NOM: string;
  IMAGE: string;
  POINTS_TOTAL: number | null;
  POINTS_BONUS: number | null;
  POINTS_ACTIFS: number | null;
  LANG: string;
  DEFIS: Defi[];
  EQUIPES: Team[];
  MINUTES_TOTAL: number | null;
  POINTS_SEMAINE_TOTAL_DEFI: number | null;
  POINTS_SEMAINE_ACTIF_DEFI: number | null;
  POINT_SEMAINE_BONUS_DEFI: number | null;
  LAST_ACTIVITY: Date;
  MISSION_COUNT: number;
  ACTIVITY_COUNT: number;
  CREATED_DATE: Date;
  EMAIL?: string;
}
