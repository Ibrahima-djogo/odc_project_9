/**
 * Service d'API pour l'application WorkPulse.
 * Gère les appels HTTP vers le backend Spring Boot avec authentification JWT.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Récupère le token JWT stocké dans le sessionStorage.
 */
export const getToken = () => sessionStorage.getItem('workpulse_token');

/**
 * Enregistre le token JWT dans le sessionStorage.
 */
export const setToken = (token) => sessionStorage.setItem('workpulse_token', token);

/**
 * Supprime le token JWT du sessionStorage.
 */
export const removeToken = () => sessionStorage.removeItem('workpulse_token');


/**
 * Effectue une requête HTTP avec injection automatique du token JWT dans les en-têtes (headers).
 */
async function requete(endpoint, options = {}) {
  const token = getToken();
  
  // En-têtes par défaut
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Si un token JWT est disponible, on l'ajoute au format Bearer
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Gestion du cas où le serveur renvoie 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Si la réponse n'est pas OK (statut hors 200-299)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur de requête : ${response.status}`);
  }

  return response.json();
}

/**
 * API Client exporté pour les composants React.
 */
export const api = {
  
  // =========================================================================
  // AUTHENTIFICATION (AUTH)
  // =========================================================================

  /**
   * Connecte un utilisateur avec son email et mot de passe.
   * Sauvegarde uniquement le token JWT — le profil complet est
   * ensuite chargé via getMoi() pour garantir des données à jour.
   */
  login: async (email, motDePasse) => {
    const res = await requete('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse })
    });
    // On ne sauvegarde QUE le token JWT (credential, pas une donnée)
    if (res.token) {
      setToken(res.token);
    }
    // Retourner uniquement le token — le profil sera chargé via getMoi()
    return { token: res.token };
  },

  /**
   * Inscrit un nouvel utilisateur.
   * Sauvegarde uniquement le token JWT — le profil complet est
   * ensuite chargé via getMoi().
   */
  register: async (nom, prenom, email, motDePasse, roleGlobal = 'MEMBRE') => {
    const res = await requete('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nom, prenom, email, motDePasse, role: roleGlobal })
    });
    if (res.token) {
      setToken(res.token);
    }
    // Retourner uniquement le token — le profil sera chargé via getMoi()
    return { token: res.token };
  },

  /**
   * Déconnexion : supprime uniquement le token JWT.
   */
  logout: () => {
    removeToken();
  },

  /**
   * Récupère le profil complet de l'utilisateur actuellement connecté
   * directement depuis la base de données via le token JWT.
   * C'est la SEULE source de vérité pour le profil utilisateur.
   */
  getMoi: async () => {
    const data = await requete('/utilisateurs/moi');
    return {
      id: data.id.toString(),
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      role: data.role || 'MEMBRE',
      roleGlobal: data.role || 'MEMBRE',
      avatarUrl: `https://ui-avatars.com/api/?name=${data.prenom}+${data.nom}&background=random`
    };
  },

  // =========================================================================
  // UTILISATEURS / COLLABORATEURS
  // =========================================================================

  /**
   * Liste tous les utilisateurs enregistrés en base.
   * Accessible à tout utilisateur authentifié (pour l'affectation aux projets).
   */
  getUtilisateurs: async () => {
    return requete('/utilisateurs');
  },

  /**
   * Met à jour les informations d'un utilisateur existant.
   */
  updateUtilisateur: async (id, { nom, prenom, email, role }) => {
    return requete(`/utilisateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nom, prenom, email, role })
    });
  },

  /**
   * Crée un nouveau compte utilisateur en tant qu'admin.
   * Appelle POST /api/utilisateurs (protégé ADMIN/SUPER_ADMIN).
   * Ne génère PAS de token — l'admin reste connecté avec son propre token.
   * Retourne { id, nom, prenom, email, role } du nouveau membre.
   */
  creerUtilisateurAdmin: async (nom, prenom, email, motDePasse, roleGlobal = 'MEMBRE') => {
    const data = await requete('/utilisateurs', {
      method: 'POST',
      body: JSON.stringify({ nom, prenom, email, motDePasse, role: roleGlobal })
    });
    return {
      id: data.id.toString(),
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      role: data.role || 'MEMBRE',
      roleGlobal: data.role || 'MEMBRE'
    };
  },


  // =========================================================================
  // PROJETS
  // =========================================================================

  /**
   * Liste les projets accessibles par l'utilisateur connecté
   * (projets dont il est créateur OU membre).
   * Route accessible à TOUS les utilisateurs authentifiés.
   * Note : /projets/tous est réservé SUPER_ADMIN uniquement (vue globale admin).
   */
  getProjets: async () => {
    const projetsBack = await requete('/projets');
    return projetsBack.map(mapProjetBackVersFront);
  },

  /**
   * Récupère un projet spécifique par son identifiant.
   */
  getProjet: async (id) => {
    const p = await requete(`/projets/${id}`);
    return mapProjetBackVersFront(p);
  },

  /**
   * Crée ou modifie un projet.
   */
  sauvegarderProjet: async (projet) => {
    // Pas de "statut" ici : il n'est plus jamais envoyé par le client, il est
    // entièrement calculé côté backend à partir des tâches du projet.
    const body = {
      nom: projet.titre,
      description: projet.description,
      dateFin: projet.dateFin || null,
      priorite: projet.priorite || 'NORMALE',
      budget: projet.budget ? parseFloat(projet.budget) : 0
    };

    if (projet.id && !projet.id.startsWith('p_')) {
      // Modification
      const p = await requete(`/projets/${projet.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return mapProjetBackVersFront(p);
    } else {
      // Création : le chef nommé et les membres cochés sont transmis dans le
      // même appel, pour que le backend les affecte en une seule transaction
      // (ProjetService.creerProjet) — ne jamais les ré-affecter après coup
      // séparément, sous peine de doublons/conflits.
      const bodyCreation = {
        ...body,
        chefDeProjetId: projet.chefDeProjetId ? parseInt(projet.chefDeProjetId, 10) : null,
        membreIdsAffectes: (projet.membreIdsAffectes || []).map(id => parseInt(id, 10))
      };
      const p = await requete('/projets', {
        method: 'POST',
        body: JSON.stringify(bodyCreation)
      });
      return mapProjetBackVersFront(p);
    }
  },

  /**
   * Supprime un projet.
   */
  supprimerProjet: async (id) => {
    return requete(`/projets/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Met à jour uniquement le budget d'un projet.
   */
  modifierBudgetProjet: async (id, budget) => {
    const p = await requete(`/projets/${id}/budget`, {
      method: 'PUT',
      body: JSON.stringify({ budget })
    });
    return mapProjetBackVersFront(p);
  },

  // =========================================================================
  // MEMBRES DU PROJET
  // =========================================================================

  /**
   * Récupère la liste des membres associés à un projet.
   */
  getMembresProjet: async (projetId) => {
    return requete(`/projets/${projetId}/membres`);
  },

  /**
   * Ajoute un collaborateur comme membre d'un projet, avec sa fonction/role
   * specifique a CE projet (ex: "DEVELOPPEUR", "DESIGNER", "TESTEUR", "CHEF_PROJET").
   */
  ajouterMembreProjet: async (projetId, utilisateurId, roleProjet = 'MEMBRE') => {
    return requete(`/projets/${projetId}/membres`, {
      method: 'POST',
      body: JSON.stringify({ utilisateurId, roleProjet })
    });
  },

  /**
   * Retire un membre d'un projet.
   */
  retirerMembreProjet: async (projetId, utilisateurId) => {
    return requete(`/projets/${projetId}/membres/${utilisateurId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Modifie la fonction/role d'un membre sur un projet spécifique.
   */
  modifierRoleMembreProjet: async (projetId, utilisateurId, roleProjet) => {
    return requete(`/projets/${projetId}/membres/${utilisateurId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleProjet })
    });
  },

  // =========================================================================
  // TACHES (TASKS)
  // =========================================================================

  /**
   * Récupère les tâches d'un projet donné.
   */
  getTachesParProjet: async (projetId) => {
    const list = await requete(`/taches/projet/${projetId}`);
    return list.map(mapTacheBackVersFront);
  },

  /**
   * Crée ou modifie une tâche.
   */
  sauvegarderTache: async (tache) => {
    const body = {
      nom: tache.titre,
      description: tache.description,
      statut: tache.statut || 'A_FAIRE',
      dateLimite: tache.dateEcheance || null,
      projetId: parseInt(tache.projetId),
      assigneAId: tache.membreAssigneId ? parseInt(tache.membreAssigneId) : null
    };

    if (tache.id && !tache.id.startsWith('t_')) {
      // Modification
      const t = await requete(`/taches/${tache.id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return mapTacheBackVersFront(t);
    } else {
      // Création
      const t = await requete('/taches', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return mapTacheBackVersFront(t);
    }
  },

  /**
   * Met à jour uniquement le statut d'une tâche (utile pour le tableau Kanban).
   */
  changerStatutTache: async (tacheId, statut) => {
    const t = await requete(`/taches/${tacheId}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut })
    });
    return mapTacheBackVersFront(t);
  },

  /**
   * Supprime une tâche.
   */
  supprimerTache: async (id) => {
    return requete(`/taches/${id}`, {
      method: 'DELETE'
    });
  },

  // =========================================================================
  // COMMENTAIRES (COMMENTS)
  // =========================================================================

  /**
   * Liste les commentaires associés à une tâche.
   */
  getCommentaires: async (tacheId) => {
    const list = await requete(`/taches/${tacheId}/commentaires`);
    return list.map(mapCommentaireBackVersFront);
  },

  /**
   * Ajoute un commentaire sur une tâche.
   */
  ajouterCommentaire: async (tacheId, contenu) => {
    const c = await requete(`/taches/${tacheId}/commentaires`, {
      method: 'POST',
      body: JSON.stringify({ contenu })
    });
    return mapCommentaireBackVersFront(c);
  },

  // =========================================================================
  // MAILS (SIMULATED EMAILS)
  // =========================================================================

  /**
   * Liste les e-mails simulés de l'utilisateur connecté.
   */
  getMails: async () => {
    return requete('/mails');
  },

  /**
   * Enregistre un nouvel e-mail simulé dans la base de données.
   */
  envoyerMail: async (destinataire, nomMembre, roleMembre, sujet, messageTexte, projetIds = []) => {
    return requete('/mails', {
      method: 'POST',
      body: JSON.stringify({
        destinataire,
        nomMembre,
        roleMembre,
        sujet,
        messageTexte,
        projetIds: projetIds.map(String)
      })
    });
  },

  /**
   * Supprime un e-mail de la base de données.
   */
  supprimerMail: async (id) => {
    return requete(`/mails/${id}`, {
      method: 'DELETE'
    });
  }
};

// =========================================================================
// FONCTIONS DE MAPPING DE FORMATS (BACKEND <-> FRONTEND)
// =========================================================================

/**
 * Mappe un objet Projet du backend vers le format attendu par le frontend.
 */
function mapProjetBackVersFront(p) {
  return {
    id: p.id.toString(),
    titre: p.nom,
    description: p.description || '',
    dateDebut: p.dateCreation ? p.dateCreation.substring(0, 10) : '',
    dateFin: p.dateFin || '',
    statut: p.statut || 'PLANIFIE',
    categorie: p.priorite === 'HAUTE' || p.priorite === 'URGENTE' ? 'Prioritaire' : 'Standard',
    priorite: p.priorite || 'NORMALE',
    budget: p.budget || 0,
    createurId: p.createurId ? p.createurId.toString() : null,
    createurNom: p.createurPrenom && p.createurNom ? `${p.createurPrenom} ${p.createurNom}` : 'Admin',
    nombreTaches: p.nombreTaches || 0,
    nombreMembres: p.nombreMembres || 0,
    // Pourcentage d'avancement calculé côté backend (TERMINE=100%, EN_COURS=50%,
    // A_FAIRE=0% — voir ProjetStatutCalculator) : à utiliser tel quel, ne jamais
    // recalculer une approximation à partir des seules tâches chargées localement.
    progression: p.progression ?? 0,
    currentUserRole: p.currentUserRole || null,
    // Booléen calculé par le backend : true si ADMIN global OU CHEF_PROJET sur ce projet
    userHasManagerRights: p.userHasManagerRights === true
  };
}

/**
 * Mappe un objet Tâche du backend vers le format attendu par le frontend.
 */
function mapTacheBackVersFront(t) {
  return {
    id: t.id.toString(),
    projetId: t.projetId.toString(),
    titre: t.nom,
    description: t.description || '',
    statut: t.statut || 'A_FAIRE',
    priorite: t.statut === 'TERMINE' ? 'BASSE' : 'HAUTE', // Approximation graphique
    dateEcheance: t.dateLimite || '',
    membreAssigneId: t.assigneAId ? t.assigneAId.toString() : null,
    nombreCommentaires: t.nombreCommentaires || 0,
    commentaires: [], // Sera chargé dynamiquement
    // Booléen calculé par le backend : true si ADMIN, chef du projet, ou
    // membre assigné à cette tâche précise.
    peutModifier: t.peutModifier === true
  };
}

/**
 * Mappe un commentaire du backend vers le format attendu par le frontend.
 */
function mapCommentaireBackVersFront(c) {
  return {
    id: c.id.toString(),
    membreId: c.auteurId.toString(),
    contenu: c.contenu,
    dateCreation: c.dateCreation,
    nomAuteur: `${c.auteurPrenom} ${c.auteurNom}`
  };
}
