import React, { useState } from 'react';
import { Mail, Trash2, Calendar, User, KeyRound, Sparkles, Send, Plus, ExternalLink } from 'lucide-react';

export default function ListeMails({ mails, membres = [], surSupprimerMail, surEnvoyerMail, utilisateurConnecte, setVueActive, setProjetFiltreId, projets = [] }) {
  const [mailSelectionne, setMailSelectionne] = useState(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [nouveauMail, setNouveauMail] = useState({ destinataire: '', sujet: '', message: '' });

  const handleEnvoyer = (e) => {
    e.preventDefault();
    if (nouveauMail.destinataire && nouveauMail.sujet && nouveauMail.message) {
      surEnvoyerMail(nouveauMail.destinataire, nouveauMail.sujet, nouveauMail.message);
      setModalOuverte(false);
      setNouveauMail({ destinataire: '', sujet: '', message: '' });
    }
  };

  /**
   * Gère le clic sur "Accéder à l'espace projet".
   * Si le mail contient des projetIds, on redirige vers le kanban filtré sur le premier projet.
   * Sinon, on redirige vers la page projets.
   */
  const accederAuProjet = () => {
    if (!setVueActive) return;
    
    if (mailSelectionne?.projetIds && mailSelectionne.projetIds.length > 0) {
      // Naviguer vers le Kanban filtré sur le premier projet associé au mail
      const premierProjetId = mailSelectionne.projetIds[0];
      if (setProjetFiltreId) setProjetFiltreId(premierProjetId);
      setVueActive('kanban');
    } else {
      // Pas de projet associé => aller à la liste des projets
      setVueActive('projets');
    }
  };

  const estInvitation = mailSelectionne && (
    mailSelectionne.expediteur === 'notifications@workpulse-odc.com' ||
    (mailSelectionne.sujet && mailSelectionne.sujet.toLowerCase().includes('invitation')) ||
    (mailSelectionne.sujet && mailSelectionne.sujet.toLowerCase().includes('bienvenue'))
  );

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark d-flex align-items-center gap-2 mb-1">
            <Mail size={28} className="text-warning" />
            Boîte Mail
          </h1>
          <p className="text-secondary mb-0">Consultez l'historique de vos e-mails et envoyez de nouveaux messages à vos collaborateurs.</p>
        </div>
        <button className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 shadow-sm text-nowrap px-3 flex-shrink-0" onClick={() => setModalOuverte(true)}>
          <Plus size={18} />
          <span>Nouveau Mail</span>
        </button>
      </div>
 
      <div className="row g-4">
        {/* Liste des Mails */}
        <div className="col-md-5">
          <div className="card bg-white border border-light-subtle rounded-4 shadow-sm h-100 overflow-hidden">
            <div className="card-header bg-light border-bottom border-light-subtle py-3 px-3">
              <h5 className="mb-0 fs-6 fw-bold text-dark">Derniers envois ({mails.length})</h5>
            </div>
            
            <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '500px' }}>
              {mails.length === 0 ? (
                <div className="text-center text-muted py-5 border-0 bg-white">
                   Aucun e-mail n'a encore été envoyé.
                </div>
              ) : (
                mails.map(mail => (
                  <button
                    key={mail.id}
                    className={`list-group-item list-group-item-action border-bottom border-light-subtle p-3 text-start bg-white transition-all ${mailSelectionne?.id === mail.id ? 'bg-light border-start border-warning border-3' : ''}`}
                    onClick={() => setMailSelectionne(mail)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                      <span className="fw-bold text-dark text-truncate fs-7" style={{ maxWidth: '180px' }}>
                        {mail.destinataire}
                      </span>
                      <small className="text-muted fs-8 d-flex align-items-center gap-1 text-nowrap">
                        <Calendar size={12} />
                        {new Date(mail.dateEnvoi).toLocaleDateString('fr-FR')} à {new Date(mail.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <div className="text-dark fw-medium fs-8 mb-1 text-truncate">{mail.sujet}</div>
                    <div className="text-muted fs-8 text-truncate">{mail.messageTexte}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Aperçu du Mail */}
        <div className="col-md-7">
          <div className="card bg-white border border-light-subtle rounded-4 shadow-sm h-100 overflow-hidden">
            <div className="card-header bg-light border-bottom border-light-subtle d-flex justify-content-between align-items-center py-3 px-3">
              <h5 className="mb-0 fs-6 fw-bold text-dark">Visualiseur de courriel</h5>
              {mailSelectionne && (
                <button 
                  className="btn btn-sm btn-link text-danger p-0"
                  onClick={() => {
                    surSupprimerMail(mailSelectionne.id);
                    setMailSelectionne(null);
                  }}
                  title="Supprimer cette notification"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="card-body p-4 bg-light d-flex flex-column justify-content-between" style={{ minHeight: '400px' }}>
              {mailSelectionne ? (
                <div className="bg-white border border-light-subtle rounded-3 p-4 shadow-sm flex-grow-1 d-flex flex-column" style={{ overflow: 'auto' }}>
                  
                  {/* Métadonnées de l'Email client mail */}
                  <div className="border-bottom border-light-subtle pb-3 mb-4 fs-7">
                    <div className="mb-1 text-dark" style={{ wordBreak: 'break-all' }}>
                      <strong className="text-secondary fw-semibold">De :</strong> {mailSelectionne.expediteur}
                    </div>
                    <div className="mb-1 text-dark" style={{ wordBreak: 'break-all' }}>
                      <strong className="text-secondary fw-semibold">À :</strong> {mailSelectionne.destinataire}
                    </div>
                    <div className="text-dark">
                      <strong className="text-secondary fw-semibold">Sujet :</strong> {mailSelectionne.sujet}
                    </div>
                  </div>

                  {/* Corps de l'email HTML simulé */}
                  <div className="flex-grow-1 p-3 border rounded-3 bg-light" style={{ overflow: 'auto' }}>
                    {estInvitation ? (
                      <div>
                        {/* En-tête de la notification système */}
                        <div className="text-center mb-4 border-bottom border-light-subtle pb-3">
                          <div className="d-inline-flex bg-dark text-warning p-2 rounded-3 mb-2 shadow-sm">
                            <Sparkles size={20} />
                          </div>
                          <h4 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>WorkPulse ODC</h4>
                          <span className="badge bg-warning-subtle text-dark border border-warning-subtle py-1 px-2.5 fs-8 fw-semibold">
                            Notification Système
                          </span>
                        </div>

                        {/* Contenu principal */}
                        <div className="fs-7 text-dark-emphasis lh-base p-3 bg-white border border-light-subtle rounded-3 shadow-sm mb-3" style={{ fontFamily: 'Georgia, serif', whiteSpace: 'pre-line' }}>
                          {mailSelectionne.messageTexte}
                        </div>

                        {/* Bloc d'informations supplémentaires (si disponible) */}
                        {mailSelectionne.roleMembre && mailSelectionne.roleMembre !== 'N/A' && (
                          <div className="bg-white p-3 rounded-3 border border-light-subtle mb-3 fs-7 text-dark shadow-sm">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <User size={16} className="text-warning" />
                              <span>Rôle affecté : <strong>{mailSelectionne.roleMembre}</strong></span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <KeyRound size={16} className="text-warning" />
                              <span>Statut d'accès : <span className="badge bg-success-subtle text-success border border-success-subtle py-1.5 px-2.5 fs-8">ACTIF (Soutenance ODC)</span></span>
                            </div>
                          </div>
                        )}

                        {/* Bouton d'action */}
                        <div className="text-center mt-4">
                          <button 
                            className="btn btn-warning text-dark fw-bold btn-sm shadow-sm d-inline-flex align-items-center gap-2"
                            onClick={accederAuProjet}
                            style={{ opacity: 1, cursor: 'pointer' }}
                          >
                            <ExternalLink size={16} />
                            Accéder à l'espace projet
                          </button>
                          {mailSelectionne.projetIds && mailSelectionne.projetIds.length > 0 && (
                            <div className="mt-2 fs-8 text-muted">
                              {(() => {
                                const projetAssocie = projets.find(p => String(p.id) === String(mailSelectionne.projetIds[0]));
                                return projetAssocie ? `Projet : ${projetAssocie.titre}` : '';
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* En-tête de message personnel */}
                        <div className="d-flex align-items-center gap-3 mb-4 border-bottom border-light-subtle pb-3">
                          <div className="d-inline-flex bg-primary-subtle text-primary p-2 rounded-circle">
                            <User size={20} className="text-warning" />
                          </div>
                          <div>
                            <h5 className="fw-bold text-dark mb-0 fs-6">Message de collaborateur</h5>
                            <small className="text-muted fs-8">Envoyé par un membre de l'équipe</small>
                          </div>
                        </div>

                        {/* Contenu principal */}
                        <div className="fs-7 text-dark lh-base p-4 bg-white border border-light-subtle rounded-3 shadow-sm" style={{ fontFamily: 'var(--bs-font-sans-serif)', whiteSpace: 'pre-line', minHeight: '120px' }}>
                          {mailSelectionne.messageTexte}
                        </div>
                        
                        <div className="mt-4 p-3 bg-warning-subtle border border-warning-subtle rounded-3 fs-8 text-dark">
                          Vous pouvez répondre à ce collaborateur en cliquant sur le bouton <strong>"Nouveau Mail"</strong> en haut de la page.
                        </div>
                      </div>
                    )}

                    {/* Pied de page commun */}
                    <div className="mt-5 pt-3 border-top border-light-subtle text-center text-muted fs-8">
                      Cet e-mail est un livrable technique pour le projet de validation ODC.<br />
                      © {new Date().getFullYear()} WorkPulse ODC.
                    </div>
                  </div>
                  
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 flex-grow-1 text-center py-5">
                  <Mail size={48} className="text-muted mb-3 opacity-50" />
                  <p className="text-secondary fs-7 mb-0">Sélectionnez un courriel à gauche pour afficher son aperçu et vérifier le message envoyé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOuverte && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-white text-dark border-light-subtle rounded-4 shadow-lg">
              <div className="modal-header border-bottom border-light-subtle">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Send size={20} className="text-warning" />
                  Nouveau Mail
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOuverte(false)}></button>
              </div>
              <form onSubmit={handleEnvoyer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fs-7 fw-semibold text-secondary">Destinataire</label>
                    <select 
                      className="form-select border-light-subtle bg-white text-dark"
                      value={nouveauMail.destinataire}
                      onChange={(e) => setNouveauMail({...nouveauMail, destinataire: e.target.value})}
                      required
                    >
                      <option value="">Sélectionner un membre...</option>
                      {membres.filter(m => m.id !== utilisateurConnecte?.id).map(m => (
                        <option key={m.id} value={m.email}>{m.prenom} {m.nom} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-7 fw-semibold text-secondary">Sujet</label>
                    <input 
                      type="text" 
                      className="form-control border-light-subtle bg-white text-dark"
                      value={nouveauMail.sujet}
                      onChange={(e) => setNouveauMail({...nouveauMail, sujet: e.target.value})}
                      placeholder="Sujet du message"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-7 fw-semibold text-secondary">Message</label>
                    <textarea 
                      className="form-control border-light-subtle bg-white text-dark"
                      rows="5"
                      value={nouveauMail.message}
                      onChange={(e) => setNouveauMail({...nouveauMail, message: e.target.value})}
                      placeholder="Votre message..."
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top border-light-subtle">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setModalOuverte(false)}>Annuler</button>
                  <button type="submit" className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2">
                    <Send size={16} /> Envoyer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
