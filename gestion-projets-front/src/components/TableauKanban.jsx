import React from 'react';
import { Plus, CheckSquare, Clock, AlertCircle, MessageSquare, Trash2 } from 'lucide-react';

export default function TableauKanban({ taches, projets, membres, projetFiltreId, setProjetFiltreId, surOuvrirModal, surSupprimerTache, surChangerStatut, utilisateurConnecte }) {
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  const estChef = estAdmin;

  // Un utilisateur globalement MEMBRE peut être CHEF_PROJET sur un projet
  // précis (userHasManagerRights, calculé côté backend) : il doit alors avoir
  // les pleins droits (créer/supprimer des tâches) sur CE projet.
  const projetFiltreActuel = projetFiltreId ? projets.find(p => p.id === projetFiltreId) : null;
  const gereProjetActuel = projetFiltreActuel
    ? projetFiltreActuel.userHasManagerRights === true
    : projets.some(p => p.userHasManagerRights === true);

  const estChefDuProjetDeTache = (tache) => {
    if (estChef) return true;
    const projetDeTache = projets.find(p => p.id === tache.projetId);
    return projetDeTache?.userHasManagerRights === true;
  };

  const tachesFiltrees = projetFiltreId
    ? taches.filter(t => t.projetId === projetFiltreId)
    : taches;

  // true si au moins une tâche visible peut être déplacée par l'utilisateur
  // connecté (ADMIN, chef de projet, ou assigné à cette tâche précise).
  const aAuMoinsUneTacheModifiable = estChef || gereProjetActuel || tachesFiltrees.some(t => t.peutModifier === true);

  const colonnes = [
    { id: 'A_FAIRE', titre: 'À faire', icone: AlertCircle, colorClass: 'text-warning', bgBadge: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' },
    { id: 'EN_COURS', titre: 'En cours', icone: Clock, colorClass: 'text-primary', bgBadge: 'bg-primary-subtle text-primary-emphasis border border-primary-subtle' },
    { id: 'TERMINE', titre: 'Terminé', icone: CheckSquare, colorClass: 'text-success', bgBadge: 'bg-success-subtle text-success-emphasis border border-success-subtle' },
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Tableau des Tâches</h1>
          <p className="text-secondary mb-0">
            Organisez et faites avancer les tâches de vos projets collaboratifs
          </p>
        </div>
        
        <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
          <select 
            className="form-select bg-white text-dark border-light-subtle shadow-sm" 
            style={{ width: 'auto', minWidth: '180px', maxWidth: '240px' }}
            value={projetFiltreId || ''}
            onChange={(e) => setProjetFiltreId(e.target.value || null)}
          >
            <option value="">Tous les projets</option>
            {projets.map(p => (
              <option key={p.id} value={p.id}>{p.titre}</option>
            ))}
          </select>

          {/* Bouton "Nouvelle Tâche" : accessible à tout membre d'au moins un projet */}
          {projets.length > 0 && (
            <button className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 shadow-sm text-nowrap px-3" onClick={() => surOuvrirModal(null)}>
              <Plus size={18} />
              <span>Nouvelle Tâche</span>
            </button>
          )}
        </div>
      </div>

      <div className="row g-4 kanban-responsive">
        {colonnes.map(col => {
          const tachesCol = tachesFiltrees.filter(t => t.statut === col.id);
          const Icone = col.icone;

          return (
            <div key={col.id} className="col-lg-4">
              <div className="card bg-light border-light-subtle h-100 shadow-sm rounded-4">
                <div className="card-header bg-white border-bottom border-light-subtle d-flex justify-content-between align-items-center py-3 rounded-top-4">
                  <div className="d-flex align-items-center gap-2">
                    <Icone size={20} className={col.colorClass} />
                    <h5 className="card-title mb-0 text-dark fw-bold">{col.titre}</h5>
                  </div>
                  <span className={`badge ${col.bgBadge} rounded-pill fs-7 px-3 py-1`}>{tachesCol.length}</span>
                </div>

                <div className="card-body d-flex flex-column gap-3 p-3">
                  {tachesCol.length === 0 ? (
                    <div className="text-center text-muted py-4 fs-7 border border-dashed rounded-3 bg-white">
                      Aucune tâche dans cette colonne
                    </div>
                  ) : (
                    tachesCol.map(tache => {
                      const projet = projets.find(p => p.id === tache.projetId);
                      const membre = membres.find(m => m.id === tache.membreAssigneId);

                      return (
                        <div key={tache.id} className="card bg-white text-dark border-light-subtle shadow-sm hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                          <div
                            className="card-body p-3"
                            onClick={() => (estChef || tache.peutModifier === true) ? surOuvrirModal(tache) : null}
                            style={{ cursor: (estChef || tache.peutModifier === true) ? 'pointer' : 'default' }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle fs-8">
                                {projet?.titre || 'Projet'}
                              </span>
                              {/* Bouton supprimer : ADMIN, chef global, ou chef du projet de CETTE tâche */}
                              {estChefDuProjetDeTache(tache) && (
                                <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                  <button className="btn btn-sm btn-link text-muted p-0 ms-2" onClick={() => surSupprimerTache(tache.id)}>
                                    <Trash2 size={15} className="text-danger" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <h6 className="card-title text-dark fw-bold mb-2">{tache.titre}</h6>
                            <p className="card-text text-secondary fs-7 mb-3 text-truncate">{tache.description}</p>

                            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light-subtle fs-8 text-muted">
                              <span className={`badge ${tache.priorite === 'HAUTE' ? 'bg-danger-subtle text-danger' : tache.priorite === 'MOYENNE' ? 'bg-warning-subtle text-dark' : 'bg-success-subtle text-success'}`}>
                                Priorité {tache.priorite.toLowerCase()}
                              </span>

                              <div className="d-flex align-items-center gap-3">
                                {tache.commentaires?.length > 0 && (
                                  <span className="d-flex align-items-center gap-1 text-primary fw-semibold">
                                    <MessageSquare size={14} />
                                    {tache.commentaires.length}
                                  </span>
                                )}

                                {membre && (
                                  <img 
                                    src={membre.avatarUrl} 
                                    alt={membre.prenom} 
                                    className="rounded-circle border border-warning"
                                    style={{ width: '26px', height: '26px', objectFit: 'cover' }}
                                    title={`Assigné à : ${membre.prenom} ${membre.nom}`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Boutons de déplacement de statut : Chefs de Projet/Admin, ou membre assigné à cette tâche */}
                          {(estChef || tache.peutModifier === true) && (
                            <div className="card-footer bg-light border-0 p-2 d-flex justify-content-between gap-2 rounded-bottom">
                              {col.id !== 'A_FAIRE' && (
                                <button 
                                  className="btn btn-sm btn-outline-secondary fs-8 py-1 px-2 w-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    surChangerStatut(tache.id, col.id === 'TERMINE' ? 'EN_COURS' : 'A_FAIRE');
                                  }}
                                >
                                  ← Reculer
                                </button>
                              )}
                              {col.id !== 'TERMINE' && (
                                <button 
                                  className="btn btn-sm btn-warning text-dark fw-semibold fs-8 py-1 px-2 w-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    surChangerStatut(tache.id, col.id === 'A_FAIRE' ? 'EN_COURS' : 'TERMINE');
                                  }}
                                >
                                  Avancer →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
