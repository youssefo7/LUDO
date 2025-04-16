/* eslint-disable @typescript-eslint/no-explicit-any */
export enum MISSION_TYPE {
  CLASSIQUE = 'CLASSIQUE',
  MILESTONE = 'MILESTONE',
  BUNDLE = 'BUNDLE',
}

export interface MissionClassique {
  IMAGE: string;
  TITRE_FR: string;
  TITRE_EN: string;
  DESCR_APERCU_FR: string;
  DESCR_APERCU_EN: string;
  POINTS: string;
  MISSION_ID: string;
}

export interface MissionMilestone {
  IMAGE: string;
  TITRE_FR: string;
  TITRE_EN: string;
  DESCR_APERCU_FR: string;
  DESCR_APERCU_EN: string;
  POINTS: string;
  MISSION_ID: string;
}

export interface MissionBundle {
  IMAGE: string;
  TITRE_FR: string;
  TITRE_EN: string;
  POINTS: string;
  MISSION_ID: string;
}

export interface DefiMission {
  MISSION_TYPE: MISSION_TYPE;
  IS_SOLO: string;
  DATE_DEBUT: Date;
  DATE_FIN: Date;
  CLASSIQUE: MissionClassique;
  MILESTONE: MissionMilestone;
  BUNDLE: MissionBundle;
  POINTS: string;
  IMAGE: string;
  TITRE_FR: string;
  TITRE_EN: string;
  DESCR_APERCU_FR: string;
  DESCR_APERCU_EN: string;
  MISSION_ID: string;
  RANG: number;
  _id: string;
  COMPLETION?: number;
  TAUX_COMPLETION?: number;
}

export interface MissionCacheKey {
  START_DATE: Date;
  END_DATE: Date;
  DEFI_ID: string;
}
