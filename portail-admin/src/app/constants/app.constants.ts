const liveDB = false;

export const API_BASE_URL = liveDB
  ? 'https://defiludo.com/api/1.1/obj'
  : 'https://defiludo.com/version-51v4w/api/1.1/obj';

export const API_WF_URL = liveDB
  ? 'https://defiludo.com/api/1.1/wf'
  : 'https://defiludo.com/version-51v4w/api/1.1/wf';

export const AUTOMATION_API_URL = liveDB
  ? 'https://admin.defiludo.com'
  : 'http://localhost:8000';

export enum DefiTimeState {
  EN_ATTENTE = 'En attente',
  PRE_DEFI = 'Pré-défi',
  SEMAINE_1 = 'Semaine 1',
  SEMAINE_2 = 'Semaine 2',
  SEMAINE_3 = 'Semaine 3',
  SEMAINE_4 = 'Semaine 4',
  APRES_DEFI = 'Après défi',
  TERMINÉ = 'Terminé',
  DEFAULT = 'En cours',
}

export const PRIVATE_PLAN = 'PRIVATE PREMIUM';
export const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
export const MAX_DATE_FALLBACK = new Date('2099-12-31T23:59:59.999Z');
export const DEFAULT_TIME = '12:00';

export const FR_LANG = 'fr';
export const FR_DATE_LANG = 'fr-FR';

export const DEFI_FIELDS = {
  NAME: 'name',
  ENTREPRISE: 'entreprise', //either pass entrepriseId or entrepriseName
  ENTREPRISE_NAME: 'entrepriseName', //depricatedpy
  START_DATE: 'dateDebut',
  END_DATE: 'dateFin',
  TAILLE_EQUIPE: 'tailleEquipe',
  TEMPLATE: 'template',
  TEMPLATE_NAME: 'templateName',
  IS_EQUIPE_LIBRE: 'isEquipeLibre',
};

export const WEEKS = [
  { label: 'Pré-défi', start: -14, end: -1 },
  { label: 'Semaine 1', start: 0, end: 6 },
  { label: 'Semaine 2', start: 7, end: 13 },
  { label: 'Semaine 3', start: 14, end: 20 },
  { label: 'Semaine 4', start: 21, end: 27 },
];
export const PRIMARY_COLOR_HEX = '#3d88ff';

export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
export const ADMIN_ROLE = 'ADMIN';
