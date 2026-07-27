import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Edit2, Check, X, Lock, Shield, ArrowLeft, RefreshCw, AlertTriangle, Users, Mail, Send, Clock, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const OPTIONS_ROLE_PROJET = [
  { value: 'MEMBRE', label: 'Membre' },
  { value: 'CHEF_PROJET', label: 'Chef de Projet' },
  { value: 'DEVELOPPEUR', label: 'Développeur' },
  { value: 'DESIGNER', label: 'UI/UX Designer' },
  { value: 'TESTEUR', label: 'QA / Testeur' },
];
const VALEURS_ROLE_PROJET_CONNUES = OPTIONS_ROLE_PROJET.map(opt => opt.value);

/**
 * Composant d'affichage détaillé d'un projet.
 * Gère les permissions en lecture/écriture contextuelles selon le rôle de l'utilisateur connecté sur ce projet.
 *
 * @param {string|number} projectId - L'ID du projet à afficher.
 * @param {function} surFermer - Fonction callback pour retourner à la vue précédente.
 */
export default function ProjectDetails({ projectId, surFermer }) {
  const [projet, setProjet] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // États pour l'édition du budget
  const [estEnEditionBudget, setEstEnEditionBudget] = useState(false);
  const [budgetEdite, setBudgetEdite] = useState('');
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [messageSucces, setMessageSucces] = useState('');

  // Membres de l'équipe affectée à ce projet, avec leur fonction (role_projet)
  const [membresProjet, setMembresProjet] = useState([]);
  const [chargementMembres, setChargementMembres] = useState(true);
  const [membreEnEdition, setMembreEnEdition] = useState(null);
  const [roleEdite, setRoleEdite] = useState('MEMBRE');
  const [roleEditeLibre, setRoleEditeLibre] = useState('');

  // Invitations par e-mail : remplace l'ancien ajout par sélection dans une
  // liste déroulante — scalable à des milliers d'utilisateurs de la plateforme.
  const [emailInvitation, setEmailInvitation] = useState('');
  const [roleInvitation, setRoleInvitation] = useState('MEMBRE');
  const [roleInvitationLibre, setRoleInvitationLibre] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [chargementInvitations, setChargementInvitations] = useState(true);
  const [envoiInvitationEnCours, setEnvoiInvitationEnCours] = useState(false);
  const [messageInvitation, setMessageInvitation] = useState(null);

  // Charger les données du projet
  useEffect(() => {
    chargerProjet();
    chargerMembres();
    chargerInvitations();
  }, [projectId]);

  const chargerProjet = async () => {
    try {
      setChargement(true);
      setErreur(null);
      const data = await api.getProjet(projectId);
      setProjet(data);
      setBudgetEdite(data.budget || '0');
    } catch (err) {
      console.error(err);
      setErreur("Impossible de charger les détails du projet. Veuillez vérifier les droits d'accès.");
    } finally {
      setChargement(false);
    }
  };

  const chargerMembres = async () => {
    try {
      setChargementMembres(true);
      const data = await api.getMembresProjet(projectId);
      setMembresProjet(data || []);
    } catch (err) {
      console.error("Impossible de charger les membres du projet", err);
      setMembresProjet([]);
    } finally {
      setChargementMembres(false);
    }
  };

  const chargerInvitations = async () => {
    try {
      setChargementInvitations(true);
      const data = await api.listerInvitationsProjet(projectId);
      setInvitations(data || []);
    } catch (err) {
      // Un simple membre (non gestionnaire) n'a pas le droit de lister les
      // invitations : on l'ignore silencieusement, la section ne s'affiche
      // de toute façon que pour les gestionnaires.
      setInvitations([]);
    } finally {
      setChargementInvitations(false);
    }
  };

  const commencerEditionRole = (membre) => {
    setMembreEnEdition(membre.utilisateurId);
    const roleActuel = membre.roleProjet || 'MEMBRE';
    if (VALEURS_ROLE_PROJET_CONNUES.includes(roleActuel)) {
      setRoleEdite(roleActuel);
      setRoleEditeLibre('');
    } else {
      // Fonction personnalisée déjà enregistrée (ni Membre, ni Chef de Projet, etc.)
      setRoleEdite('Autre');
      setRoleEditeLibre(roleActuel);
    }
  };

  const enregistrerRole = async (membre) => {
    const roleAEnvoyer = roleEdite === 'Autre' ? (roleEditeLibre.trim() || 'Autre') : roleEdite;
    try {
      const misAJour = await api.modifierRoleMembreProjet(projectId, membre.utilisateurId, roleAEnvoyer);
      setMembresProjet(prev => prev.map(m => m.utilisateurId === membre.utilisateurId ? misAJour : m));
      setMembreEnEdition(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la fonction de ce membre.");
    }
  };

  // Envoyer une invitation par e-mail à rejoindre ce projet
  const envoyerInvitation = async (e) => {
    e.preventDefault();
    const emailNettoye = emailInvitation.trim().toLowerCase();
    if (!emailNettoye) return;

    const roleAEnvoyer = roleInvitation === 'Autre' ? (roleInvitationLibre.trim() || 'Autre') : roleInvitation;

    try {
      setEnvoiInvitationEnCours(true);
      setMessageInvitation(null);
      const res = await api.inviterMembre(projectId, emailNettoye, roleAEnvoyer);
      setEmailInvitation('');
      setRoleInvitation('MEMBRE');
      setRoleInvitationLibre('');
      const lien = res?.lienInvitation;
      setMessageInvitation({
        type: 'success',
        texte: lien
          ? `Invitation créée pour ${emailNettoye} ! Lien d'accès : ${lien}`
          : `Invitation créée pour ${emailNettoye}.`
      });
      await chargerInvitations();
    } catch (err) {
      console.error(err);
      setMessageInvitation({ type: 'danger', texte: err.message || "Erreur lors de l'envoi de l'invitation." });
    } finally {
      setEnvoiInvitationEnCours(false);
    }
  };

  const annulerInvitation = async (invitationId) => {
    try {
      await api.revoquerInvitation(projectId, invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'annulation de l'invitation.");
    }
  };

  // Enregistrer le nouveau budget
  const gererSauvegardeBudget = async () => {
    if (!projet) return;

    try {
      setSauvegardeEnCours(true);
      // Appel à l'API sécurisée du backend
      const projetMisAJour = await api.modifierBudgetProjet(projet.id, parseFloat(budgetEdite));

      setProjet(projetMisAJour);
      setEstEnEditionBudget(false);
      setMessageSucces("Budget mis à jour avec succès !");
      setTimeout(() => setMessageSucces(''), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du budget. Accès refusé ou entrée invalide.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
        <RefreshCw className="text-warning animate-spin mb-3" size={32} />
        <p className="text-secondary">Chargement des détails du projet...</p>
      </div>
    );
  }

  if (erreur || !projet) {
    return (
      <div className="card border-danger-subtle bg-danger-subtle p-4 rounded-4 shadow-sm text-center">
        <AlertTriangle className="text-danger mb-3" size={40} />
        <h4 className="text-danger fw-bold">Erreur de chargement</h4>
        <p className="text-secondary mb-3">{erreur || "Projet introuvable"}</p>
        <button className="btn btn-outline-secondary fw-semibold mx-auto" onClick={surFermer}>
          <ArrowLeft size={16} className="me-2" /> Retour
        </button>
      </div>
    );
  }

  // Vérifier si l'utilisateur connecté a les droits de gestion sur ce projet
  // (true si ADMIN global OU CHEF_PROJET contextuel — calculé par le backend)
  const aLesDroitsDeGestion = projet.userHasManagerRights === true;

  return (
    <div className="card bg-white border border-light-subtle rounded-4 p-4 shadow-sm text-dark">
      {/* En-tête avec bouton retour */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
        <button className="btn btn-link text-secondary p-0 d-flex align-items-center gap-2 text-decoration-none fw-semibold" onClick={surFermer}>
          <ArrowLeft size={18} />
          <span>Retour aux projets</span>
        </button>

        {/* Badge dynamique indiquant le rôle sur le projet */}
        <div className="d-flex align-items-center gap-2">
          {aLesDroitsDeGestion ? (
            <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-3 py-2 fs-7 fw-bold d-flex align-items-center gap-1">
              <Shield size={14} className="text-warning" />
              {projet.currentUserRole === 'ADMIN' ? 'Administrateur' : 'Chef de Projet'}
            </span>
          ) : (
            <span className="badge bg-light text-secondary border border-light-subtle px-3 py-2 fs-7 fw-semibold d-flex align-items-center gap-1">
              Rôle : {projet.currentUserRole ? projet.currentUserRole.replace('_', ' ') : 'Membre'}
            </span>
          )}
        </div>
      </div>

      {/* Titre & Description du projet */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-2">{projet.titre}</h2>
        <p className="text-secondary fs-6 leading-relaxed" style={{ maxWidth: '750px' }}>
          {projet.description || "Aucune description fournie pour ce projet."}
        </p>
      </div>

      {/* Grid d'informations */}
      <div className="row g-4 mb-4">
        {/* Section Budget */}
        <div className="col-md-6">
          <div className="card bg-light border-light-subtle rounded-4 p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold text-secondary fs-7 uppercase-tracking">Budget du Projet</span>
              {!aLesDroitsDeGestion && (
                <span className="text-muted fs-8 d-flex align-items-center gap-1">
                  <Lock size={12} /> Lecture seule
                </span>
              )}
            </div>

            {estEnEditionBudget && aLesDroitsDeGestion ? (
              /* Vue d'édition du budget : uniquement pour les gestionnaires (ADMIN ou CHEF_PROJET) */
              <div>
                <div className="input-group mb-2">
                  <span className="input-group-text bg-white text-success fw-bold"><DollarSign size={16} /></span>
                  <input
                    type="number"
                    className="form-control bg-white text-dark"
                    value={budgetEdite}
                    onChange={(e) => setBudgetEdite(e.target.value)}
                    placeholder="Ex: 50000"
                    disabled={sauvegardeEnCours}
                  />
                  <button className="btn btn-success d-flex align-items-center justify-content-center" onClick={gererSauvegardeBudget} disabled={sauvegardeEnCours}>
                    {sauvegardeEnCours ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => { setEstEnEditionBudget(false); setBudgetEdite(projet.budget); }} disabled={sauvegardeEnCours}>
                    <X size={16} />
                  </button>
                </div>
                <small className="text-muted fs-8">Saisissez le budget en GNF.</small>
              </div>
            ) : (
              /* Vue d'affichage du budget */
              <div className="d-flex align-items-center justify-content-between">
                <span className="fs-3 fw-bold text-success">
                  {projet.budget != null ? Number(projet.budget).toLocaleString('fr-FR') : '0'} GNF
                </span>
                {aLesDroitsDeGestion && (
                  <button className="btn btn-sm btn-outline-warning text-dark fw-semibold d-flex align-items-center gap-1 px-3 py-1.5" onClick={() => setEstEnEditionBudget(true)}>
                    <Edit2 size={14} />
                    <span>Modifier</span>
                  </button>
                )}
              </div>
            )}

            {messageSucces && (
              <div className="alert alert-success fs-8 py-2 px-3 mt-3 mb-0 rounded-3">
                {messageSucces}
              </div>
            )}
          </div>
        </div>

        {/* Section Statistiques rapides */}
        <div className="col-md-6">
          <div className="card bg-light border-light-subtle rounded-4 p-3 h-100 d-flex flex-column justify-content-center">
            <div className="row text-center">
              <div className="col-6 border-end">
                <div className="fs-3 fw-bold text-dark">{projet.nombreTaches}</div>
                <div className="text-secondary fs-8 fw-semibold">Tâches totales</div>
              </div>
              <div className="col-6">
                <div className="fs-3 fw-bold text-dark">{projet.nombreMembres}</div>
                <div className="text-secondary fs-8 fw-semibold">Membres affectés</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Membres de l'équipe, avec leur fonction PROPRE A CE PROJET */}
      <div className="border-top pt-4 mt-2 mb-2">
        <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <Users size={20} className="text-warning" />
          Membres de l'équipe
        </h4>

        {chargementMembres ? (
          <p className="text-secondary fs-7">Chargement des membres...</p>
        ) : membresProjet.length === 0 ? (
          <p className="text-secondary fs-7">Aucun membre affecté à ce projet pour le moment.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="text-secondary fs-8 text-uppercase">
                  <th>Membre</th>
                  <th>Fonction sur ce projet</th>
                  {aLesDroitsDeGestion && <th className="text-end">Action</th>}
                </tr>
              </thead>
              <tbody>
                {membresProjet.map(m => (
                  <tr key={m.membreProjetId}>
                    <td className="fs-7 text-dark fw-semibold">{m.utilisateurPrenom} {m.utilisateurNom}</td>
                    <td>
                      {membreEnEdition === m.utilisateurId ? (
                        <div className="d-flex flex-column gap-1" style={{ maxWidth: '220px' }}>
                          <select
                            className="form-select form-select-sm bg-white text-dark border-light-subtle"
                            value={roleEdite}
                            onChange={(e) => setRoleEdite(e.target.value)}
                          >
                            {OPTIONS_ROLE_PROJET.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                            <option value="Autre">Autre...</option>
                          </select>
                          {roleEdite === 'Autre' && (
                            <input
                              type="text"
                              className="form-control form-control-sm bg-white text-dark border-light-subtle"
                              placeholder="Ex: Scrum Master, Rédacteur..."
                              value={roleEditeLibre}
                              onChange={(e) => setRoleEditeLibre(e.target.value)}
                              autoFocus
                            />
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-light text-dark border border-light-subtle fs-8">
                          {(m.roleProjet || 'MEMBRE').replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    {aLesDroitsDeGestion && (
                      <td className="text-end">
                        {membreEnEdition === m.utilisateurId ? (
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="btn btn-sm btn-success" onClick={() => enregistrerRole(m)}>
                              <Check size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setMembreEnEdition(null)}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-outline-warning text-dark fw-semibold" onClick={() => commencerEditionRole(m)}>
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section Invitation par e-mail : remplace l'ancienne sélection dans
          une liste déroulante de tous les utilisateurs de la plateforme.
          Visible uniquement pour les gestionnaires de ce projet précis. */}
      {aLesDroitsDeGestion && (
        <div className="border-top pt-4 mt-2 mb-2">
          <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <Mail size={20} className="text-warning" />
            Inviter un collaborateur
          </h4>

          <form onSubmit={envoyerInvitation} className="card bg-light border-light-subtle rounded-4 p-3 mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-5">
                <label className="form-label fs-8 text-secondary fw-semibold mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  className="form-control bg-white text-dark border-light-subtle"
                  placeholder="collaborateur@email.com"
                  value={emailInvitation}
                  onChange={(e) => setEmailInvitation(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fs-8 text-secondary fw-semibold mb-1">Fonction sur ce projet</label>
                <select
                  className="form-select bg-white text-dark border-light-subtle"
                  value={roleInvitation}
                  onChange={(e) => setRoleInvitation(e.target.value)}
                >
                  {OPTIONS_ROLE_PROJET.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value="Autre">Autre...</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <button type="submit" className="btn btn-warning text-dark fw-bold w-100 d-flex align-items-center justify-content-center gap-2" disabled={envoiInvitationEnCours}>
                  {envoiInvitationEnCours ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                  <span>Inviter</span>
                </button>
              </div>
              {roleInvitation === 'Autre' && (
                <div className="col-12">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-light-subtle"
                    placeholder="Ex: Scrum Master, Rédacteur..."
                    value={roleInvitationLibre}
                    onChange={(e) => setRoleInvitationLibre(e.target.value)}
                  />
                </div>
              )}
            </div>
            {messageInvitation && (
              <div className={`alert alert-${messageInvitation.type} fs-8 py-2 px-3 mt-3 mb-0 rounded-3`}>
                {(() => {
                  const matchUrl = messageInvitation.texte?.match(/(https?:\/\/[^\s]+)/);
                  if (!matchUrl) return messageInvitation.texte;
                  const url = matchUrl[0];
                  const avant = messageInvitation.texte.substring(0, matchUrl.index);
                  return (
                    <span>
                      {avant}
                      <code className="fw-bold text-dark ms-1 p-1 bg-white border rounded" style={{ wordBreak: 'break-all', userSelect: 'all' }}>
                        {url}
                      </code>
                    </span>
                  );
                })()}
              </div>
            )}
          </form>

          {chargementInvitations ? (
            <p className="text-secondary fs-8">Chargement des invitations...</p>
          ) : invitations.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr className="text-secondary fs-8 text-uppercase">
                    <th>Invitation en attente</th>
                    <th>Fonction proposée</th>
                    <th></th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map(inv => (
                    <tr key={inv.id}>
                      <td className="fs-7 text-dark">{inv.email}</td>
                      <td>
                        <span className="badge bg-light text-dark border border-light-subtle fs-8">
                          {(inv.roleProjet || 'MEMBRE').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="fs-8 text-muted d-flex align-items-center gap-1">
                        <Clock size={12} />
                        Expire le {new Date(inv.dateExpiration).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => annulerInvitation(inv.id)} title="Annuler l'invitation">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section d'Exportation - Masquée si l'utilisateur n'a pas les droits de gestion */}
      {aLesDroitsDeGestion && (
        <div className="border-top pt-4 mt-2">
          <h4 className="fw-bold text-dark mb-3">Zone de Gestion Administrative</h4>
          <div className="card border-warning-subtle bg-warning-subtle p-3 rounded-4" style={{ maxWidth: '600px' }}>
            <h5 className="fs-7 fw-bold text-warning-emphasis mb-1">Export complet de la Base de Données</h5>
            <p className="text-secondary fs-8 mb-3">
              Vous disposez des droits d'exportation SQL & JSON pour la remise de vos rapports d'avancement ODC.
            </p>
            <div className="d-flex gap-2">
              <button className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-2" onClick={() => alert("Génération de l'export SQL...")}>
                <Download size={14} />
                <span>Télécharger Script .SQL</span>
              </button>
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={() => alert("Génération de l'export JSON...")}>
                <Download size={14} />
                <span>Télécharger JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
