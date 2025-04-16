export const ERROR_MSGS = {
  TEAM_CREATE_FAILED: "Échec lors de la création de l'équipe",
  TEAM_UPDATE_FAILED: "Échec lors de la modification de l'équipe",
  TEAM_DELETE_FAILED: "Échec lors de la suppression de l'équipe",
  TEAM_ASSIGN_MEMBER_FAILED: "Échec lors de l'ajout d'un membre à l'équipe",

  MISSION_ASSIGN_FAILED: "Échec lors de l'assignation de la mission",
  MISSION_UPDATE_FAILED: 'Échec lors de la modification de la mission',
  MISSION_DELETE_FAILED: 'Échec lors du retrait de la mission',
  MISSION_FETCH_FAILED: 'Échec lors de la récupération des missions',
  MISSION_STATS_FETCH_FAILED: 'Échec lors de la récupération des statistiques de mission',

  ENTREPRISES_FETCH_FAILED: 'Échec lors de la récupération des entreprises',
  ANNONCE_CREATE_FAILED: "Échec lors de la création de l'annonce",
  ANNONCE_UPDATE_FAILED: "Échec lors de la modification de l'annonce",
  ANNONCE_DELETE_FAILED: "Échec lors de la suppression de l'annonce",
  ANNONCE_FETCH_FAILED: 'Échec lors de la récupération des annonces',
  ANNONCE_MISSING_ID: "L'ID de l'annonce est manquant.",

  DEFI_CREATE_FAILED: 'Échec lors de la création du défi',
  DEFI_UPDATE_FAILED: 'Échec lors de la modification du défi',
  DEFI_DELETE_FAILED: 'Échec lors de la suppression du défi',

  ENTREPRISE_CREATE_FAILED: "Échec lors de la création de l'entreprise",

  EQUIPE_GET_FAILED: 'Échec lors de la récupération des équipes.',
  EQUIPE_CONFIRM_FAILED: 'Échec lors de la confirmation des équipes',

  USER_DELETE_FROM_DEFI_FAILED:
    'Échec lors de la suppression du participant du défi',
  USER_DELETE_FROM_TEAM_FAILED:
    "Échec lors de la suppression du participant de l'équipe",

  TEAM_MEMBERS_FETCH_FAILED: 'Échec lors de la récupération des utilisateurs',
  DEFI_NAMES_FETCH_FAILED: 'Échec lors de la récupération des noms de défi',
  TEAM_NAMES_FETCH_FAILED: "Échec lors de la récupération des noms d'équipe",

  TEMPLATE_CREATE_FAILED: 'Erreur lors de la création du template',
  TEMPLATE_DELETE_FAILED: 'Erreur lors de la suppression du template',
  TEMPLATE_FETCH_FAILED: 'Erreur lors de la récupération des templates',
  TEMPLATE_UPDATE_FAILED: 'Erreur lors de la mise à jour du template',
  TEMPLATE_MISSION_FETCH_FAILED:
    'Erreur lors de la récupération des missions du template',

  COPY_FAILED: 'Erreur lors de la copie',
  FORM_VALIDATION_FAILED: 'Veuillez remplir les champs correctement.',

  LOGIN_FAILED_UNKNOWN: 'Erreur inconnue. Veuillez réessayer.',
  LOGIN_FAILED_INVALID:
    'Identifiants invalides. Veuillez vérifier votre adresse e-mail et votre mot de passe.',
  LOGIN_TOKEN_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',

  UNAUTHORIZED: '401 - Non autorisé.',
  NOT_ALLOWED: '403 - Droits insuffisants.',
  NOT_FOUND: '404 - Ressource Introuvable.',
  SERVER_ERROR: '500 - Erreur serveur.',
  UNEXPECTED_ERROR: 'Erreur inattendu.',

  GENERIC: 'Une erreur est survenue. Veuillez réessayer.',
  UNKNOWN: 'Erreur inconnue',
  NETWORK_ERROR: 'Erreur réseau. Veuillez vérifier votre connexion internet.',
  TIMEOUT: "Délai d'attente dépassé. Veuillez réessayer.",

  STATS_CHART_MISSING_INFO:
    'Defi ID or date range is missing. Cannot fetch chart.',

  PERMISSION_FETCH_ERROR : 'Erreur lors de la récupération des permissions.',
};
