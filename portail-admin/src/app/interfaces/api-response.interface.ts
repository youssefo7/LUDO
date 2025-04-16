export interface ApiResponse<T> {
  response: {
    results: T[];
    cursor?: number;
    count?: number;
    remaining?: number;
    user_count?: number;
  };
}

export interface SingleApiResponse<T> {
  response: T;
}

export interface TeamUser {
  userId: string;
  name: string;
  department: string;
  estimatedPts: number;
}

export interface TeamSeparationPayload {
  teamName: string;
  teamId: string;
  users: TeamUser[];
}

interface ApiUser {
  user_id: string;
  name?: string;
  department?: string;
  estimated_pts?: number;
}

interface ApiTeam {
  team_id: string;
  team_name: string;
  users: ApiUser[];
}

export interface TeamSeparationApiResponse {
  team_assignments: ApiTeam[];
}

export interface Permission {
  _id: string;
  USER: string;
  ENTITY_TYPE: 'ORGANISATION' | 'DEFI' | '';
  ENTITY_ID: string;
  ROLE: 'ADMIN' | 'SUPER_ADMIN' | '';
}
