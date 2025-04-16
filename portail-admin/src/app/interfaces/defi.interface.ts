import { DefiTimeState } from "../constants/app.constants";

export interface Defi {
  ALGO: string;
  ALGO_DEPARTEMENTS: string[];
  ALGO_VILLES: string[];
  CHOIX_EQUIPE_LIBRE: boolean;
  CODE: string;
  DATE_BONUS: Date;
  DATE_DEBUT: Date;
  DATE_FIN: Date;
  IS_PUBLIC: boolean;
  NOM_DEFI_EN: string | null;
  NOM_DEFI_ES: string | null;
  NOM_DÉFI_FR: string | null;
  ENTREPRISE: string;
  TAILLE_EQUIPE: number | null;
  TRAMES: string[];
  _id: string;
}

export interface TimeSlot {
  LABEL: DefiTimeState;
  START_DATE: Date;
  END_DATE: Date;
}