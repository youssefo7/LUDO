export interface DISCOVER_DATA_TYPE {
  ENDPOINT: string;
  LABEL_FR: string;
  IS_DATA_API: boolean;
  KPI_TYPE: KPI_TYPE;
  METRIC_TYPE: METRIC_TYPE;
  RANG: number;
}

export enum KPI_TYPE {
  UNIT = 'UNIT',
  POURCENTAGE = 'POURCENTAGE',
  GRAPH = 'GRAPH',
}

export enum METRIC_TYPE {
  SOCIAL = 'SOCIAL',
  INVITATION = 'INVITATION',
  GLOBAL = 'GENERAL',
}
