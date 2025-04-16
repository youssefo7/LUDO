import { MISSION_TYPE, MissionBundle, MissionClassique, MissionMilestone } from './missions.interface';

export interface Template {
  _id: string;
  DESCRIPTION: string;
  NOM: string;
  IMAGE: string;
  'Created Date': Date;
}

export interface TemplateMission {
  MISSION_TYPE: MISSION_TYPE;
  OFFSET_DEBUT: number;
  OFFSET_FIN: number;
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
}

export interface TemplateAnnonce {
  JOUR: number;
  FR_TITRE: string;
  FR_SOUS_TITRE: string;
  EN_SOUS_TITRE: string;
  EN_TITRE: string;
  UTM_TAG: string;
  TEMPLATE: string;
  HEURE: number;
  MIN: number;
  _id: string;
}