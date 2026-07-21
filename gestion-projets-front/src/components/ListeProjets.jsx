import React from 'react';
import { Plus, Calendar, Edit3, Trash2, ArrowRight, DollarSign, Users } from 'lucide-react';

export default function ListeProjets({ projets, taches, surOuvrirModal, surSupprimerProjet, setVueActive, setProjetFiltreId, setProjetDetailId, utilisateurConnecte }) {
  // Droits de gestion GLOBAUX : ADMIN/SUPER_ADMIN, ou CHEF_DE_PROJET au niveau
  // du compte. Ce niveau conditionne la création de NOUVEAUX projets (un rôle
  // par projet n'existe pas encore avant leur création).
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  const estChef = estAdmin || utilisateurConnecte?.roleGlobal === 'CHEF_DE_PROJET';

  // Un utilisateur globalement MEMBRE peut malgré tout être CHEF_PROJET sur un
  // ou plusieurs projets précis (membres_projet.role_projet) — le backend le
  // signale via userHasManagerRights sur chaque ProjetResponse.
  const gereAuMoinsUnProjet = projets.some(p => p.userHasManagerRights === true);

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Gestion des Projets</h1>
          <p className="text-secondary mb-0">
            {(estChef || gereAuMoinsUnProjet) ? 'Créez et suivez vos projets d\'équipe' : 'Consultez les projets de l\'équipe (lecture seule)'}
          </p>
        </div>
        {/* Bouton "Nouveau Projet" : création d'un projet requiert le droit global (aucun rôle par-projet n'existe encore) */}
        {estChef && (
          <button className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 shadow-sm text-nowrap" onClick={() => surOuvrirModal(null)}>
            <Plus size={18} />
            <span>Nouveau Projet</span>
          </button>
        )}
      </div>

      <div className="row g-4">
        {projets.map((projet) => {
          const tachesProjet = taches.filter(t => t.projetId === projet.id);
          const terminees = tachesProjet.filter(t => t.statut === 'TERMINE').length;
          const progression = tachesProjet.length > 0 ? Math.round((terminees / tachesProjet.length) * 100) : 0;

          return (
            <div key={projet.id} className="col-md-6 col-lg-4">
              <div className="card bg-white border border-light-subtle rounded-4 h-100 shadow-sm p-3 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-3 py-2 fs-8 fw-semibold">
                      {projet.categorie || 'Projet'}
                    </span>
                    {/* Boutons Modifier / Supprimer : ADMIN, chef global, ou chef de CE projet précis */}
                    {(estChef || projet.userHasManagerRights === true) && (
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-link text-secondary p-1" onClick={() => surOuvrirModal(projet)} title="Modifier le projet">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-sm btn-link text-danger p-1" onClick={() => surSupprimerProjet(projet.id)} title="Supprimer le projet">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="h5 fw-bold text-dark mb-2">{projet.titre}</h3>
                  <p className="fs-7 text-secondary mb-3" style={{ minHeight: '40px' }}>
                    {projet.description}
                  </p>

                  <div className="d-flex align-items-center gap-2 fs-8 text-muted mb-2">
                    <Calendar size={15} />
                    <span>{projet.dateDebut} — {projet.dateFin}</span>
                  </div>

                  {/* Budget visible pour tous (Chef et Membre peuvent le consulter) */}
                  {projet.budget != null && projet.budget > 0 && (
                    <div className="d-flex align-items-center gap-2 fs-8 text-muted mb-2">
                      <DollarSign size={15} className="text-success" />
                      <span className="fw-semibold text-success">
                        {Number(projet.budget).toLocaleString('fr-FR')} GNF
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-top border-light-subtle">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between fs-8 mb-1">
                      <span className="text-secondary fw-semibold">Progression du projet</span>
                      <span className="fw-bold text-dark">{terminees}/{tachesProjet.length} tâches ({progression}%)</span>
                    </div>
                    
                    {/* Barre de progression interactive & animée */}
                    <div className="progress rounded-pill shadow-inner" style={{ height: '14px', backgroundColor: '#e2e8f0' }}>
                      <div 
                        className={`progress-bar progress-bar-striped progress-bar-animated ${progression === 100 ? 'bg-success' : 'bg-warning text-dark'} fw-bold fs-8`}
                        role="progressbar" 
                        style={{ width: `${progression}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      >
                        {progression > 15 && `${progression}%`}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fs-7 fw-semibold"
                      onClick={() => {
                        setProjetFiltreId(projet.id);
                        setVueActive('kanban');
                      }}
                    >
                      <span>Ouvrir les tâches</span>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-3"
                      title="Membres de l'équipe"
                      onClick={() => {
                        setProjetDetailId(projet.id);
                        setVueActive('details');
                      }}
                    >
                      <Users size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
