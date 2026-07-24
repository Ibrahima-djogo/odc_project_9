import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ListeProjets from './components/ListeProjets';
import ProjectDetails from './components/ProjectDetails';
import TableauKanban from './components/TableauKanban';
import ListeMembres from './components/ListeMembres';
import ListeMails from './components/ListeMails';
import ServiceExport from './components/ServiceExport';
import ModalProjet from './components/ModalProjet';
import ModalTache from './components/ModalTache';
import Login from './components/Login';
import Toast from './components/Toast';
import { api } from './services/api';

/**
 * Composant principal de l'application WorkPulse.
 * Gère l'état global (projets, tâches, membres, activités) en se synchronisant
 * de manière asynchrone avec le serveur Spring Boot.
 */
function App() {
  // Navigation et filtres
  const [vueActive, setVueActive] = useState('dashboard');
  const [recherche, setRecherche] = useState('');
  const [projetFiltreId, setProjetFiltreId] = useState(null);
  const [projetDetailId, setProjetDetailId] = useState(null);
  const [estSidebarReduit, setEstSidebarReduit] = useState(false);

  // Responsivité mobile
  const [estMobile, setEstMobile] = useState(window.innerWidth < 768);
  const [sidebarMobileOuverte, setSidebarMobileOuverte] = useState(false);

  // Authentification et notifications
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
  const [toast, setToast] = useState(null);

  // Token d'invitation par e-mail présent dans l'URL (?invite=TOKEN), lu une
  // seule fois au chargement — voir gererConnexion pour l'acceptation.
  const [inviteToken, setInviteToken] = useState(
    () => new URLSearchParams(window.location.search).get('invite')
  );

  // États des données issues du backend
  const [projets, setProjets] = useState([]);
  const [taches, setTaches] = useState([]);
  const [membres, setMembres] = useState([]);
  const [activites, setActivites] = useState([]);
  
  // Les mails sont en mémoire (pas d'endpoint backend) — réinitialisés à chaque session
  const [mails, setMails] = useState([]);

  // États de visibilité des modals
  const [modalProjetOuverte, setModalProjetOuverte] = useState(false);
  const [projetEdite, setProjetEdite] = useState(null);
  const [modalTacheOuverte, setModalTacheOuverte] = useState(false);
  const [tacheEditee, setTacheEditee] = useState(null);

  /**
   * Au démarrage : si un token JWT est présent, on recharge le profil
   * utilisateur directement depuis le backend (/api/utilisateurs/moi).
   * Aucune donnée utilisateur n'est lue depuis le navigateur.
   */
  useEffect(() => {
    const token = sessionStorage.getItem('workpulse_token');
    if (token) {
      api.getMoi()
        .then(profil => {
          setUtilisateurConnecte(profil);
        })
        .catch(() => {
          // Token expiré ou invalide — on nettoie et on affiche le login
          api.logout();
          setUtilisateurConnecte(null);
        });
    }
  }, []);

  // Détection de la taille d'écran pour le mode mobile
  useEffect(() => {
    const gererRedimensionnement = () => {
      const mobile = window.innerWidth < 768;
      setEstMobile(mobile);
      if (!mobile) {
        setSidebarMobileOuverte(false);
      }
    };
    window.addEventListener('resize', gererRedimensionnement);
    return () => window.removeEventListener('resize', gererRedimensionnement);
  }, []);

  // Dès qu'un utilisateur est connecté, on charge ses données depuis le serveur
  useEffect(() => {
    if (utilisateurConnecte) {
      chargerDonnees();
    }
  }, [utilisateurConnecte]);

  /**
   * Récupère l'ensemble des données (projets, tâches, membres) depuis le backend
   * et reconstruit les structures de données complexes attendues par l'interface.
   */
  const chargerDonnees = async () => {
    try {
      // 1. Charger la liste des projets
      const listProjets = await api.getProjets();
      setProjets(listProjets);

      // 2. Charger les tâches de tous les projets en parallèle
      if (listProjets.length > 0) {
        const listesTaches = await Promise.all(
          listProjets.map(p => api.getTachesParProjet(parseInt(p.id)))
        );
        const toutesLesTaches = listesTaches.flat();

        // Charger également les commentaires pour chaque tâche
        const tachesAvecCommentaires = await Promise.all(
          toutesLesTaches.map(async (t) => {
            try {
              const comms = await api.getCommentaires(parseInt(t.id));
              return { ...t, commentaires: comms };
            } catch {
              return { ...t, commentaires: [] };
            }
          })
        );
        setTaches(tachesAvecCommentaires);
      } else {
        setTaches([]);
      }

      // 3. Charger la liste des utilisateurs enregistrés
      const utilisateurs = await api.getUtilisateurs();
      
      // Construire la liste des membres avec leurs projets associés (Many-to-Many au backend)
      const membresMap = {};
      utilisateurs.forEach(u => {
        membresMap[u.id] = {
          id: u.id.toString(),
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          avatarUrl: `https://ui-avatars.com/api/?name=${u.prenom}+${u.nom}&background=random`,
          // roleGlobal (ADMIN/MEMBRE) est le SEUL rôle qui vit au niveau utilisateur,
          // pour la sécurité applicative globale. Le backend l'expose sous la clé "role".
          roleGlobal: u.role || 'MEMBRE',
          projetIds: [],
          // Fonction/rôle de ce membre PAR PROJET (ex: { '3': 'DEVELOPPEUR', '5': 'CHEF_PROJET' }),
          // vient de membres_projet.role_projet — une même personne peut avoir une fonction
          // différente sur chaque projet.
          projetRoles: {}
        };
      });

      // Associer chaque membre aux projets qu'il intègre, avec sa fonction propre à CE projet
      await Promise.all(
        listProjets.map(async (p) => {
          try {
            const membresProjet = await api.getMembresProjet(parseInt(p.id));
            membresProjet.forEach(mp => {
              if (membresMap[mp.utilisateurId]) {
                const pId = p.id.toString();
                membresMap[mp.utilisateurId].projetIds.push(pId);
                membresMap[mp.utilisateurId].projetRoles[pId] = mp.roleProjet;
              }
            });
          } catch (e) {
            console.error("Impossible de charger les membres du projet", p.id, e);
          }
        })
      );

      setMembres(Object.values(membresMap));

      // 4. Charger les e-mails simulés depuis le backend
      try {
        const listMails = await api.getMails();
        setMails(listMails || []);
      } catch (e) {
        console.error("Impossible de charger les e-mails", e);
      }
    } catch (err) {
      console.error("Erreur de chargement des données API :", err);
      declencherToast("Erreur lors de la synchronisation avec le serveur", "danger");
    }
  };

  /**
   * Affiche un message toast d'information en bas à droite de l'écran.
   */
  const declencherToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  /**
   * Enregistre une activité dans le journal local.
   */
  const ajouterActiviteLocale = (action) => {
    if (!utilisateurConnecte) return;
    const nvelles = [
      {
        id: 'act_' + Date.now(),
        membreId: utilisateurConnecte.id,
        action,
        dateAction: new Date().toISOString()
      },
      ...activites
    ].slice(0, 30);
    setActivites(nvelles);
  };

  /**
   * Simule l'envoi d'un e-mail d'information aux collaborateurs.
   */
  const envoyerMailSimule = async (destinataire, nomMembre, roleMembre, sujet, messageTexte, projetIds = []) => {
    try {
      await api.envoyerMail(destinataire, nomMembre, roleMembre, sujet, messageTexte, projetIds);
      // Recharger les e-mails depuis le backend
      try {
        const listMails = await api.getMails();
        setMails(listMails || []);
      } catch (e) {
        console.error(e);
      }
      declencherToast(`Notification envoyée à ${destinataire} !`, 'mail');
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email simulé au backend :", err);
    }
  };

  // =========================================================================
  // GESTION DE SESSION / UTILISATEURS
  // =========================================================================



  /**
   * Connexion réussie : le token est déjà stocké par api.login().
   * On charge le profil complet depuis le backend et on déclenche
   * le chargement de toutes les données.
   */
  const gererConnexion = async (estNouvelInscrit = false) => {
    try {
      const profil = await api.getMoi();
      setUtilisateurConnecte(profil);

      if (estNouvelInscrit) {
        envoyerMailSimule(
          profil.email,
          `${profil.prenom} ${profil.nom}`,
          profil.role,
          'Bienvenue sur la plateforme WorkPulse ODC',
          `Bonjour ${profil.prenom} ${profil.nom}, votre compte a été créé avec succès. Rôle : ${profil.role}.`
        );
      } else {
        declencherToast(`Bonjour ${profil.prenom}, ravi de vous revoir !`);
      }

      // Si la connexion/inscription vient d'un lien d'invitation, on
      // l'accepte automatiquement puis on atterrit directement sur le projet.
      if (inviteToken) {
        try {
          const resultat = await api.accepterInvitation(inviteToken);
          if (resultat?.projetId) {
            setProjetFiltreId(resultat.projetId.toString());
            setVueActive('kanban');
          }
          declencherToast('Vous avez rejoint le projet avec succès !');
        } catch (err) {
          console.error("Erreur lors de l'acceptation de l'invitation :", err);
          declencherToast(err.message || "Impossible d'accepter cette invitation.", 'danger');
        } finally {
          // Nettoie l'URL (retire ?invite=...) pour ne pas ré-accepter au
          // prochain rafraîchissement de la page.
          window.history.replaceState({}, '', window.location.pathname);
          setInviteToken(null);
        }
      }
    } catch (err) {
      console.error('Erreur chargement profil :', err);
      api.logout();
      declencherToast('Impossible de charger votre profil.', 'danger');
    }
  };

  const gererDeconnexion = () => {
    api.logout(); // supprime uniquement le token JWT du sessionStorage
    setUtilisateurConnecte(null);
    setProjets([]);
    setTaches([]);
    setMembres([]);
    setMails([]);
    declencherToast('Déconnexion réussie. À bientôt !');
  };



  // =========================================================================
  // GESTION DES PROJETS
  // =========================================================================

  const ouvrimodalProjet = (projet = null) => {
    setProjetEdite(projet);
    setModalProjetOuverte(true);
  };

  /**
   * Crée ou modifie un projet en base. Les affectations de membres ne
   * passent plus par ici : à la création, on devient seul chef du projet
   * (voir ProjetService.creerProjet) ; les collaborateurs sont ensuite
   * invités par e-mail depuis la fiche du projet (ProjectDetails.jsx).
   */
  const sauvegarderProjet = async (projet) => {
    try {
      const isEdition = projet.id && !projet.id.startsWith('p_');
      const projetSauve = await api.sauvegarderProjet(projet);

      // Log d'activité
      ajouterActiviteLocale(`${isEdition ? 'a modifié' : 'a créé'} le projet "${projetSauve.titre}"`);

      setModalProjetOuverte(false);
      declencherToast(isEdition ? "Projet mis à jour avec succès !" : "Nouveau projet créé avec succès !");
      
      // Recharger les données à jour
      await chargerDonnees();
    } catch (err) {
      console.error(err);
      declencherToast("Erreur lors de la sauvegarde du projet", "danger");
    }
  };

  /**
   * Supprime définitivement un projet du serveur.
   */
  const supprimerProjet = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce projet et ses tâches associées ?')) {
      try {
        const projetAsupprimer = projets.find(p => p.id === id);
        await api.supprimerProjet(parseInt(id));
        
        if (projetAsupprimer) {
          ajouterActiviteLocale(`a supprimé le projet "${projetAsupprimer.titre}"`);
        }
        declencherToast("Projet supprimé.");
        await chargerDonnees();
      } catch (err) {
        console.error(err);
        declencherToast("Impossible de supprimer le projet", "danger");
      }
    }
  };

  // =========================================================================
  // GESTION DES TACHES
  // =========================================================================

  const ouvrimodalTache = (tache = null) => {
    setTacheEditee(tache);
    setModalTacheOuverte(true);
  };

  /**
   * Enregistre ou modifie une tâche en base de données.
   */
  const sauvegarderTache = async (tache) => {
    try {
      const isEdition = tache.id && !tache.id.startsWith('t_');
      const tacheSauvee = await api.sauvegarderTache(tache);

      // Enregistrement de l'activité
      ajouterActiviteLocale(`${isEdition ? 'a mis à jour' : 'a créé'} la tâche "${tacheSauvee.titre}"`);

      setModalTacheOuverte(false);
      declencherToast(isEdition ? "Tâche modifiée !" : "Tâche créée avec succès !");
      await chargerDonnees();
    } catch (err) {
      console.error(err);
      declencherToast("Erreur lors de la sauvegarde de la tâche", "danger");
    }
  };

  /**
   * Supprime une tâche de la base.
   */
  const supprimerTache = async (id) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      try {
        await api.supprimerTache(parseInt(id));
        declencherToast("Tâche supprimée.");
        await chargerDonnees();
      } catch (err) {
        console.error(err);
        declencherToast("Erreur lors de la suppression", "danger");
      }
    }
  };

  /**
   * Change le statut d'une tâche (ex: Glisser-déposer sur le Kanban).
   */
  const changerStatutTache = async (tacheId, nouveauStatut) => {
    try {
      const t = taches.find(x => x.id === tacheId);
      if (t) {
        await api.changerStatutTache(parseInt(tacheId), nouveauStatut);
        ajouterActiviteLocale(`a changé le statut de la tâche "${t.titre}" à ${nouveauStatut}`);
        await chargerDonnees();
      }
    } catch (err) {
      console.error(err);
      declencherToast("Erreur lors du déplacement de la tâche", "danger");
    }
  };

  /**
   * Enregistre un commentaire en base et l'associe à la tâche.
   */
  const ajouterCommentaireTache = async (tacheId, membreId, contenu) => {
    try {
      await api.ajouterCommentaire(parseInt(tacheId), contenu);
      
      const t = taches.find(x => x.id === tacheId);
      if (t) {
        ajouterActiviteLocale(`a commenté la tâche "${t.titre}"`);
      }
      
      declencherToast("Commentaire ajouté !");
      await chargerDonnees();

      // Mettre à jour l'affichage en temps réel dans le modal
      if (tacheEditee && tacheEditee.id === tacheId) {
        const comms = await api.getCommentaires(parseInt(tacheId));
        setTacheEditee(prev => ({ ...prev, commentaires: comms }));
      }
    } catch (err) {
      console.error(err);
      declencherToast("Erreur lors de l'ajout du commentaire", "danger");
    }
  };

  // =========================================================================
  // GESTION DES MEMBRES DE L'EQUIPE
  // =========================================================================

  /**
   * Crée ou met à jour un collaborateur et ses projets associés.
   */
  const sauvegarderMembre = async (membre) => {
    try {
      const emailLower = membre.email.toLowerCase();
      let utilisateurId = membre.id;
      const estNouveau = !membre.id || membre.id.startsWith('m_');

      // roleGlobal (ADMIN/MEMBRE) n'est un choix explicite qu'en modification
      // d'un membre existant (ModalMembre masque le sélecteur à la création) ;
      // le backend force de toute façon MEMBRE pour tout nouveau compte.
      const roleGlobal = membre.roleGlobal || 'MEMBRE';

      if (estNouveau) {
        // Le mot de passe est défini par l'admin dans le formulaire de création
        const mdp = membre.motDePasse || 'Password123!';

        // creerUtilisateurAdmin() appelle POST /api/utilisateurs (endpoint admin)
        // Ne génère PAS de token : l'admin reste connecté avec sa propre session
        const nouveauMembre = await api.creerUtilisateurAdmin(
          membre.nom, membre.prenom, emailLower, mdp, roleGlobal
        );
        utilisateurId = nouveauMembre.id;

        // Notification simulée incluant les identifiants de connexion
        envoyerMailSimule(
          membre.email,
          `${membre.prenom} ${membre.nom}`,
          roleGlobal,
          'Invitation sur la plateforme WorkPulse ODC',
          `Bonjour ${membre.prenom} ${membre.nom}, vous avez été ajouté(e) à l'équipe.\n\n` +
          `Vos identifiants de connexion :\n` +
          `Email : ${membre.email}\n` +
          `Mot de passe : ${mdp}\n\n` +
          `Connectez-vous sur la plateforme et changez votre mot de passe dès que possible.`,
          []
        );
        declencherToast(`Compte créé pour ${membre.prenom} ${membre.nom} !`);

      } else {
        const idNumerique = (membre.id && !isNaN(membre.id)) ? parseInt(membre.id, 10) : null;
        if (idNumerique) {
          await api.updateUtilisateur(idNumerique, {
            nom: membre.nom,
            prenom: membre.prenom,
            email: emailLower,
            role: roleGlobal
          });
        }
        declencherToast("Informations du collaborateur mises à jour.");
      }

      // L'affectation à un projet ne se fait plus ici : elle passe désormais
      // exclusivement par le système d'invitation par e-mail, depuis la
      // fiche de chaque projet (ProjectDetails.jsx → api.inviterMembre).

      await chargerDonnees();
    } catch (err) {
      console.error(err);
      declencherToast("Erreur lors de la mise à jour du membre", "danger");
    }
  };

  /**
   * Retire une notification de l'historique local et du backend.
   */
  const supprimerMail = async (id) => {
    try {
      await api.supprimerMail(parseInt(id));
      setMails(mails.filter(m => String(m.id) !== String(id)));
      declencherToast("E-mail supprimé de l'historique.");
    } catch (err) {
      console.error("Erreur lors de la suppression de l'e-mail :", err);
      declencherToast("Impossible de supprimer l'e-mail du serveur", "danger");
    }
  };

  const envoyerMailLibre = async (destinataireEmail, sujet, message) => {
    try {
      await api.envoyerMail(destinataireEmail, 'Utilisateur', 'N/A', sujet, message, []);
      // Recharger les e-mails depuis le backend
      try {
        const listMails = await api.getMails();
        setMails(listMails || []);
      } catch (e) {
        console.error(e);
      }
      ajouterActiviteLocale(`a envoyé un e-mail à ${destinataireEmail}`);
      declencherToast("E-mail envoyé avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'e-mail libre :", err);
      declencherToast("Erreur lors de l'envoi de l'e-mail", "danger");
    }
  };

  // Si l'utilisateur n'est pas connecté, on affiche l'écran de Login
  if (!utilisateurConnecte) {
    return (
      <>
        <Login surConnexion={gererConnexion} inviteToken={inviteToken} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            surFermer={() => setToast(null)}
          />
        )}
      </>
    );
  }

  // Filtrage réactif par recherche
  const projetsFiltres = projets.filter(p =>
    p.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    p.description.toLowerCase().includes(recherche.toLowerCase())
  );

  // Déterminer si l'utilisateur est un simple membre (rôle global)
  const estMembreSimple = utilisateurConnecte?.roleGlobal === 'MEMBRE';

  // Projets sur lesquels l'utilisateur connecté est CHEF_PROJET (ou ADMIN) :
  // même en étant globalement MEMBRE, il doit voir TOUTES les tâches de ces
  // projets-là, pas seulement celles qui lui sont assignées.
  const projetsIdsGeres = new Set(
    projets.filter(p => p.userHasManagerRights === true).map(p => p.id)
  );

  // Filtrage des tâches : par recherche, puis par membre si rôle MEMBRE
  // (sauf sur les projets que l'utilisateur gère spécifiquement)
  const tachesFiltrees = taches.filter(t => {
    const correspondRecherche = t.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      t.description.toLowerCase().includes(recherche.toLowerCase());
    if (!correspondRecherche) return false;
    if (estMembreSimple && !projetsIdsGeres.has(t.projetId)) {
      return String(t.membreAssigneId) === String(utilisateurConnecte.id);
    }
    return true;
  });

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Overlay pour sidebar mobile */}
      {estMobile && (
        <div
          className={`sidebar-overlay ${sidebarMobileOuverte ? 'active' : ''}`}
          onClick={() => setSidebarMobileOuverte(false)}
        />
      )}

      <Sidebar
        vueActive={vueActive}
        setVueActive={(vue) => {
          setVueActive(vue);
          if (estMobile) setSidebarMobileOuverte(false);
        }}
        estReduit={estMobile ? false : estSidebarReduit}
        setEstReduit={setEstSidebarReduit}
        surDeconnexion={gererDeconnexion}
        utilisateurConnecte={utilisateurConnecte}
        estMobile={estMobile}
        sidebarMobileOuverte={sidebarMobileOuverte}
      />

      <div
        className={`d-flex flex-column ${estMobile ? 'main-content-mobile' : ''}`}
        style={{
          marginLeft: estMobile ? '0px' : (estSidebarReduit ? '80px' : '260px'),
          width: estMobile ? '100%' : (estSidebarReduit ? 'calc(100% - 80px)' : 'calc(100% - 260px)'),
          minHeight: '100vh',
          minWidth: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Navbar
          recherche={recherche}
          setRecherche={setRecherche}
          surClicNouveauProjet={() => ouvrimodalProjet(null)}
          surClicNouvelleTache={() => ouvrimodalTache(null)}
          utilisateurConnecte={utilisateurConnecte}
          surDeconnexion={gererDeconnexion}
          estMobile={estMobile}
          surOuvrirSidebar={() => setSidebarMobileOuverte(true)}
        />

        <main className="p-4 flex-grow-1">
          {vueActive === 'dashboard' && (
            <Dashboard
              projets={projetsFiltres}
              taches={tachesFiltrees}
              membres={membres}
              activites={activites}
              setVueActive={setVueActive}
              setProjetFiltreId={setProjetFiltreId}
              utilisateurConnecte={utilisateurConnecte}
            />
          )}

          {vueActive === 'projets' && (
            <ListeProjets
              projets={projetsFiltres}
              taches={taches}
              surOuvrirModal={ouvrimodalProjet}
              surSupprimerProjet={supprimerProjet}
              setVueActive={setVueActive}
              setProjetFiltreId={setProjetFiltreId}
              setProjetDetailId={setProjetDetailId}
              utilisateurConnecte={utilisateurConnecte}
            />
          )}

          {vueActive === 'details' && projetDetailId && (
            <ProjectDetails
              projectId={parseInt(projetDetailId)}
              surFermer={() => setVueActive('projets')}
            />
          )}

          {vueActive === 'kanban' && (
            <TableauKanban
              taches={tachesFiltrees}
              projets={projets}
              membres={membres}
              projetFiltreId={projetFiltreId}
              setProjetFiltreId={setProjetFiltreId}
              surOuvrirModal={ouvrimodalTache}
              surSupprimerTache={supprimerTache}
              surChangerStatut={changerStatutTache}
              utilisateurConnecte={utilisateurConnecte}
            />
          )}

          {vueActive === 'membres' && (
            <ListeMembres
              membres={membres}
              projets={projets}
              taches={taches}
              surSauvegarderMembre={sauvegarderMembre}
              utilisateurConnecte={utilisateurConnecte}
            />
          )}

          {vueActive === 'mails' && (
            <ListeMails
              mails={mails.filter(m => m.destinataire === utilisateurConnecte?.email || m.expediteur === utilisateurConnecte?.email)}
              membres={membres}
              surSupprimerMail={supprimerMail}
              surEnvoyerMail={envoyerMailLibre}
              utilisateurConnecte={utilisateurConnecte}
              setVueActive={setVueActive}
              setProjetFiltreId={setProjetFiltreId}
              projets={projets}
            />
          )}

          {/* Export : réservé aux administrateurs globaux (ADMIN/SUPER_ADMIN) */}
          {vueActive === 'export' && (
            (utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN')
              ? <ServiceExport projets={projets} taches={taches} membres={membres} />
              : (
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                  <div className="text-center p-5 rounded-4 border border-danger-subtle bg-danger-subtle shadow-sm" style={{ maxWidth: '480px' }}>
                    <div className="fs-1 mb-3 text-danger"><i className="bi bi-lock-fill"></i></div>
                    <h2 className="h4 fw-bold text-danger mb-2">Accès refusé</h2>
                    <p className="text-secondary mb-0">
                      La section <strong>Export BDD</strong> est réservée aux <strong>Administrateurs</strong>.
                      Contactez votre responsable si vous avez besoin d'un export.
                    </p>
                  </div>
                </div>
              )
          )}
        </main>
      </div>

      {/* Modals globales */}
      {modalProjetOuverte && (
        <ModalProjet
          projetEdite={projetEdite}
          surFermer={() => setModalProjetOuverte(false)}
          surSauvegarder={sauvegarderProjet}
          utilisateurConnecte={utilisateurConnecte}
        />
      )}

      {modalTacheOuverte && (
        <ModalTache
          tacheEditee={tacheEditee}
          projets={projets}
          membres={membres}
          utilisateurConnecte={utilisateurConnecte}
          surFermer={() => setModalTacheOuverte(false)}
          surSauvegarder={sauvegarderTache}
          surAjouterCommentaire={ajouterCommentaireTache}
        />
      )}

      {/* Popups Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          surFermer={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
