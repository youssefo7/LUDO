from http.client import HTTPException
import logging
import math
from fastapi import FastAPI, Header, Query
import httpx
from typing import List, Dict, Optional
import json
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

logging.basicConfig(
    level=logging.INFO,  # Change to logging.INFO in production
    format="%(asctime)s - %(levelname)s - %(message)s",
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "https://d2zn9pgzunrg4l.cloudfront.net"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

LIVE_DB = os.getenv("LIVE_DATABASE", "False").strip().lower() == "true"

LIVE_BASE_URL = "https://defiludo.com/api/1.1"
DEV_BASE_URL =  "https://defiludo.com/version-51v4w/api/1.1"

BASE_URL= LIVE_BASE_URL if LIVE_DB else DEV_BASE_URL
BASE_DATA_API_URL =f"{BASE_URL}/obj"
BASE_WF_API_URL = f"{BASE_URL}/wf"

TEAMS_URL = f"{BASE_DATA_API_URL}/equipes"
USER_EQUIPE_URL = f"{BASE_DATA_API_URL}/user_equipe"
USER_ALGO_URL = f"{BASE_DATA_API_URL}/user_algo"
DEFI_URL = f"{BASE_DATA_API_URL}/defi"

ADD_USER_TO_TEAM_WF_URL = f"{BASE_WF_API_URL}/add_user_to_team"
UPDATE_USER_TEAM_WF_URL = f"{BASE_WF_API_URL}/update_user_team"
CREATE_TEAM_WF_URL = f"{BASE_WF_API_URL}/create_team"
GET_USERS_WF_URL = f"{BASE_WF_API_URL}/get_users_by_defi"
LOGIN_WF_URL = f"{BASE_WF_API_URL}/login"

client: httpx.AsyncClient = None
BUBBLE_AUTH_HEADER = None
WORKFLOW_RETURN_LIMIT = 50  # Bubble returns max 50 per request


def estimate_points(algo_activite: float, algo_competitivite: float) -> float:
    """Calculate the estimated points for a user."""
    estimated_pts = 2672 + 2916 * algo_activite + 568 * algo_competitivite
    logging.debug(f"Estimated points: {estimated_pts} (Activité: {algo_activite}, Compétitivité: {algo_competitivite})")
    return estimated_pts

async def create_team(defi_id: str, team_name: str) -> str:
    """Create a new team and return its ID."""
    payload = {"DEFI": defi_id, "NOM": team_name}
    logging.info(f"Creating team with name: {team_name} for defi: {defi_id}")
    headers = {"Authorization": BUBBLE_AUTH_HEADER}
    
    try:
        response = await client.post(CREATE_TEAM_WF_URL, json=payload, headers=headers)
        response.raise_for_status()
        team_id = response.json().get("response", {}).get("id", '')
        logging.info(f"Team created successfully: {team_id}")
        return team_id
    except httpx.HTTPStatusError as e:
        logging.error(f"Failed to create team '{team_name}' for defi {defi_id}: {e.response.json()}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while creating team '{team_name}': {str(e)}")
        raise
    
async def patch_user_assignment(user_id: str, old_team_id: str, new_team_id: str):
    """Reassign a user from one team to another using Bubble's workflow APIs."""
    
    update_payload = {"USER": user_id, "OLD_EQUIPE": old_team_id, "NEW_EQUIPE": new_team_id}
    headers = {"Authorization": BUBBLE_AUTH_HEADER}

    try:          
        logging.info(f"Moving user {user_id} from team {old_team_id} to team {new_team_id}")
        remove_response = await client.post(UPDATE_USER_TEAM_WF_URL, json=update_payload, headers=headers)
        remove_response.raise_for_status()
        logging.info(f"User {user_id} successfully removed from team {old_team_id} and added to team {new_team_id}")

        
    except httpx.HTTPStatusError as e:
        error_details = e.response.json() if e.response.content else {"error": "No response content"}
        logging.error(f"Failed to update user {user_id} assignment: {error_details}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        raise
        
async def assign_user_to_team(user_id: str, team_id: str):
    """Assign a user to a team and log errors if the request fails."""
    payload = {
        "USER": user_id,
        "EQUIPE": team_id,
    }
    
    logging.info(f"Assigning user {user_id} to team {team_id}")
    
    headers = {"Authorization": BUBBLE_AUTH_HEADER}

    try:
        response = await client.post(ADD_USER_TO_TEAM_WF_URL, json=payload, headers=headers)
        response.raise_for_status()
        logging.info(f"User {user_id} successfully assigned to team {team_id}")
    except httpx.HTTPStatusError as e:
        error_details = e.response.json() if e.response.content else {"error": "No response content"}
        logging.error(f"Failed to assign user {user_id} to team {team_id}: {error_details}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while assigning user {user_id} to team {team_id}: {str(e)}")
        raise

async def propose_user_distribution(users: List[Dict], existing_teams: Dict[str, List[Dict]], separate_departments: bool = False):
    """Propose to Distribute users into teams while balancing estimated points and optionally separating departments."""

    logging.info(f"Distributing {len(users)} users across {len(existing_teams)} teams (Separate Departments: {separate_departments})")
    users = sorted(users, key=lambda x: x["estimated_points"], reverse=True)

    if separate_departments:
        logging.debug("Distributing users while separating departments")
        departments = {}
        for user in users:
            dept = user.get("ALGO_DEPT", "Unknown")
            if dept not in departments:
                departments[dept] = []
            departments[dept].append(user)


        team_list = list(existing_teams.keys())
        team_points = {team_id: sum(user["estimated_points"] for user in members) for team_id, members in existing_teams.items()}
        team_assignments = {team_id: set(user["ALGO_DEPT"] for user in members) for team_id, members in existing_teams.items()}


        for dept, dept_users in departments.items():
            for user in dept_users:

                min_team = min(
                    team_list,
                    key=lambda t: (1 if dept in team_assignments[t] else 0, team_points[t])
                )
                existing_teams[min_team].append(user)
                team_points[min_team] += user["estimated_points"]
                team_assignments[min_team].add(dept)

    else:
        logging.debug("Distributing users without separating departments")
        team_points = {team_id: sum(user["estimated_points"] for user in members) for team_id, members in existing_teams.items()}
        for user in users:
            min_team = min(team_points, key=team_points.get)  
            existing_teams[min_team].append(user)
            team_points[min_team] += user["estimated_points"]
    logging.info("User distribution proposition complete.")
    return existing_teams


async def fetch_all_users(defi_id: str, limit: Optional[int] = None) -> List[Dict]:
    """Fetch all users linked to a defi_id, with pagination and logging."""
    headers = {"Authorization": BUBBLE_AUTH_HEADER}
    all_users = []
    offset = 1
    has_more = True
    last_batch = None

    logging.info(f"Fetching users from {GET_USERS_WF_URL} for DEFI={defi_id}")

    async with httpx.AsyncClient() as client:
        while has_more:
            params = {
                "DEFI": defi_id,
                "offset": offset
            }
            try:
                response = await client.get(GET_USERS_WF_URL, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                logging.error(f"Failed to fetch users: {e.response.text}")
                raise
            except Exception as e:
                logging.error(f"Unexpected error while fetching users: {str(e)}")
                raise

            raw_results = data.get("response", {}).get("results", [])
            results = []
            for user in raw_results:
                if isinstance(user, str):
                    try:
                        parsed_user = json.loads(user)
                        results.append(parsed_user)
                    except json.JSONDecodeError as e:
                        logging.warning(f"Skipping invalid user JSON: {e}")
                elif isinstance(user, dict):
                    results.append(user)
                else:
                    logging.warning(f"Skipping unknown user format: {user}")
            current_batch = str(results)

            if current_batch == last_batch:
                logging.warning("Detected repeated batch, stopping to avoid infinite loop.")
                break
            last_batch = current_batch

            all_users.extend(results)

            logging.info(f"Fetched {len(results)} users in this batch. Total so far: {len(all_users)}")

            if len(results) < WORKFLOW_RETURN_LIMIT:
                has_more = False
            else:
                offset += WORKFLOW_RETURN_LIMIT

            if limit and len(all_users) >= limit:
                logging.info(f"Reached limit of {limit} users.")
                break

    return all_users[:limit] if limit else all_users


async def fetch_defi_name(defi_id: str) -> str:
    """Fetch defi name from its ID."""
    constraints = [{"key": "_id", "constraint_type": "equals", "value": defi_id}]
    params = {"constraints": json.dumps(constraints)}

    logging.info(f"Fetching defi name from {DEFI_URL} with params: {params}")

    try:
        response = await client.get(DEFI_URL, params=params)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPStatusError as e:
        logging.error(f"Failed to fetch defi name: {e.response.json()}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while fetching defi name: {str(e)}")
        raise

    defi = data.get("response", {}).get("results", [{}])[0]
    defi_name = defi.get("NOM_DÉFI_FR") or defi.get("NOM_DÉFI_EN") or "Unknown"
    logging.info(f"Fetched defi name: {defi_name}")
    return defi_name

async def fetch_team_assignments(team_ids: List[str]) -> Dict[str, str]:
    """Fetch user assignments only for the given team IDs."""
    if not team_ids:
        return {}

    constraints = [{"key": "equipe", "constraint_type": "in", "value": team_ids}]
    params = {"constraints": json.dumps(constraints)}

    logging.info(f"Fetching team assignments from {USER_EQUIPE_URL} with params: {params}")

    try:
        response = await client.get(USER_EQUIPE_URL, params=params)
        response.raise_for_status()
        assignments = response.json().get("response", {}).get("results", [])
    except httpx.HTTPStatusError as e:
        if response.status_code == 404:
            logging.warning("API returned 404 Not Found. Check constraints formatting.")
            return {}
        logging.error(f"Failed to fetch team assignments: {e.response.json()}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while fetching team assignments: {str(e)}")
        raise

    assignment_dict = {}
    for assignment in assignments:
        user = assignment.get("USER")
        equipe = assignment.get("EQUIPE")
        record_id = assignment.get("_id")
        if user and equipe and record_id:
            assignment_dict[user] = {
                "team_id": equipe,
                "record_id": record_id,
            }
        else:
            logging.warning(f"Skipping incomplete assignment: {assignment}")
            
    return assignment_dict

async def fetch_existing_teams(defi_id: str) -> List[Dict]:
    """Fetch existing teams for the given defi_id."""
    constraints = [{"key": "defi", "constraint_type": "equals", "value": defi_id}]
    params = {"constraints": json.dumps(constraints)}

    logging.info(f"Fetching existing teams from {TEAMS_URL} with params: {params}")

    try:
        response = await client.get(TEAMS_URL, params=params)
        response.raise_for_status()
        teams = response.json().get("response", {}).get("results", [])
    except httpx.HTTPStatusError as e:
        if response.status_code == 404:
            logging.warning("API returned 404 Not Found. Check constraints formatting.")
            return []
        logging.error(f"Failed to fetch existing teams: {e.response.json()}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while fetching teams: {str(e)}")
        raise

    logging.info(f"Fetched {len(teams)} teams.")
    return teams

async def fetch_user_algos(defi_id: str) -> Dict[str, Dict[str, float]]:
    """Fetch ALGO_PHYS, ALGO_DEPT, and ALGO_COMP for users in the given defi."""
    constraints = [{"key": "defi", "constraint_type": "equals", "value": defi_id}]
    params = {"constraints": json.dumps(constraints)}
    headers = {"Authorization": BUBBLE_AUTH_HEADER}

    logging.info(f"Fetching user algo data from {USER_ALGO_URL} with params: {params}")

    try:
        response = await client.get(USER_ALGO_URL, params=params, headers=headers)
        response.raise_for_status()
        user_algos = response.json().get("response", {}).get("results", [])
    except httpx.HTTPStatusError as e:
        if response.status_code == 404:
            logging.warning("API returned 404 Not Found. Check constraints formatting.")
            return {}
        logging.error(f"Failed to fetch user algos: {e.response.json()}")
        raise
    except Exception as e:
        logging.error(f"Unexpected error while fetching user algos: {str(e)}")
        raise

    algo_dict = {
        user["Created By"]: {
            "ALGO_PHYS": user.get("ALGO_PHYS", 0),
            "ALGO_DEPT": user.get("ALGO_DEPT", ""),
            "ALGO_COMP": user.get("ALGO_COMP", 0),
        }
        for user in user_algos
    }

    logging.info(f"Fetched algo data for {len(algo_dict)} users.")
    return algo_dict


async def merge_user_data(users: List[Dict], defi_id: str) -> List[Dict]:
    """Merge user data with algorithm-related fields."""
    logging.info(f"Merging user data with algo fields for defi {defi_id}")
    user_algos = await fetch_user_algos(defi_id)
    logging.debug(f"Fetched users {users} ")
    logging.debug(f"Fetched users algos {user_algos} ")
    for user in users:
        user_id = user["_id"]
        algo_data = user_algos.get(user_id, {"ALGO_PHYS": 0, "ALGO_DEPT": "", "ALGO_COMP": 0})
        user.update(algo_data)

    logging.info(f"Merged algo data into {len(users)} users.")
    return users


@app.get("/health")
async def health_check():
    """Health check endpoint to ensure the server is running."""
    return {"status": "ok", "message": "Server is running"}


@app.get("/propose-team-separation")
async def assign_teams(
    defi_id: str = Query(..., alias="defiId"),
    max_users_per_team: Optional[int] = Query(10, alias="maxUsersPerTeam"),
    max_n_team: Optional[int] = Query(None, alias="maxTeams"),
    separate_departments: Optional[bool] = Query(True, alias="separateDepartments"),
    authorization: Optional[str] = Header(None)
):
    """Assign users to teams, balancing estimated points."""

    global client
    client = httpx.AsyncClient()
    
    global BUBBLE_AUTH_HEADER
    BUBBLE_AUTH_HEADER = authorization
    if not BUBBLE_AUTH_HEADER:
        logging.error("Impossible de récupérer le token, arrêt de l'exécution.")
        return []
    
    defi_name = await fetch_defi_name(defi_id)

    users = await fetch_all_users(defi_id, limit=150)
    existing_teams_data = await fetch_existing_teams(defi_id) #teams that already exist before the separation automation
    existing_teams = {team["_id"]: [] for team in existing_teams_data}
    user_assignments = await fetch_team_assignments(list(existing_teams.keys())) #users that are already assigned to a team
    logging.debug(f"Fetched users team assignments {user_assignments} ")
    users = await merge_user_data(users, defi_id) #get user algo infor for each user
    
    unassigned_users = []
    for user in users:
        user["estimated_points"] = estimate_points(user.get("ALGO_PHYS", 0), user.get("ALGO_COMP", 0)) #estimate points for each user
        user_id = user["_id"]
        if user_id in user_assignments:
            assignment = user_assignments.get(user_id)
            team_id = assignment["team_id"] if assignment else None
            if team_id in existing_teams:
                existing_teams[team_id].append(user)
        else:
            unassigned_users.append(user)
            
    required_teams = math.ceil(len(users) / max_users_per_team)
            
    while len(existing_teams) < required_teams:
        new_team_name= f"Equipe {len(existing_teams) + 1} - {defi_name}"
        new_team_id = await create_team(defi_id, new_team_name) #create new teams
        existing_teams[new_team_id] = []
        existing_teams_data.append({"_id": new_team_id, "NOM": new_team_name})
        
    
    updated_teams = await propose_user_distribution(unassigned_users, existing_teams, separate_departments)

    result = {
        "team_assignments": [
            {
                "team_id": team_id,
                "team_name": next((team["NOM"] for team in existing_teams_data if team["_id"] == team_id), "Unknown"),
                "estimated_pts": sum(user["estimated_points"] for user in members),
                "users": [
                    {
                        "user_id": user["_id"],
                        "name":  user["PRENOM"] + ' ' +user["NOM"],
                        "department": user.get("ALGO_DEPT", "Unknown"),
                        "estimated_pts": user["estimated_points"]
                    }
                    for user in members
                ]
            }
            for team_id, members in updated_teams.items()
        ]
    }

    return result

@app.post("/confirm-team-separation")
async def confirm_team_separation(
    proposed_teams: Dict[str, List[Dict]], 
    authorization: Optional[str] = Header(None)
):
    """Apply the proposed team assignments."""
    
    logging.info("Confirming team assignments.")
    
    global client
    client = httpx.AsyncClient()
    
    global BUBBLE_AUTH_HEADER
    BUBBLE_AUTH_HEADER = authorization
    if not BUBBLE_AUTH_HEADER:
        logging.error("Impossible de récupérer le token, arrêt de l'exécution.")
        return []
    team_ids = list(proposed_teams.keys())
    existing_assignments = await fetch_team_assignments(team_ids)
    logging.info(f"Received proposed teams: {json.dumps(proposed_teams, indent=2)}")
    for team_id, members in proposed_teams.items():
        for user in members:
            user_id = user["user_id"]
            assignment = existing_assignments.get(user_id)
            current_team = assignment["team_id"] if assignment else None
            record_id = assignment["record_id"] if assignment else None
            
            if current_team == team_id:
                logging.info(f"Skipping assignment: User {user_id} is already in team {team_id}")
                continue
            
            if record_id:
                await patch_user_assignment(user_id, current_team, team_id)
                logging.info(f"Updated User {user_id} assignment to correct team {team_id}")

            else:
                await assign_user_to_team(user_id, team_id)
                logging.info(f"Assigned User {user_id} to correct team {team_id}")


    logging.info("Team assignments confirmed.")
    return {"message": "Team assignments have been successfully applied."}


