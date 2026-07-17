import React from 'react';
import { FolderKanban, CheckCircle2, Clock, Users, ArrowUpRight, Activity } from 'lucide-react';

export default function Dashboard({ projets, taches, membres, activites, setVueActive, setProjetFiltreId, utilisateurConnecte }) {
  const nbProjetsTotal = projets.length;
  const nbProjetsEnCours = projets.filter(p => p.statut === 'EN_COURS').length;
  const nbTachesTotal = taches.length;
  const nbTachesTerminees = taches.filter(t => t.statut === 'TERMINE').length;
  const nbTachesEnCours = taches.filter(t => t.statut === 'EN_COURS').length;
  const tauxReussite = nbTachesTotal > 0 ? Math.round((nbTachesTerminees / nbTachesTotal) * 100) : 0;
  // "Collaborateurs" désigne les AUTRES personnes avec qui l'utilisateur
  // travaille : on exclut son propre compte du décompte (0 s'il est seul).
  const nbCollaborateurs = membres.filter(m => m.id !== utilisateurConnecte?.id).length;

  return (
    <div>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">Tableau de bord de suivi</h1>
        <p className="text-secondary mb-0">Vue d’ensemble des projets et activités de votre équipe</p>
      </div>

      {/* Stats Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 121, 0, 0.12)', color: 'var(--accent-orange)' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <div className="stat-val">{nbProjetsEnCours} / {nbProjetsTotal}</div>
            <div className="stat-label">Projets en cours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{nbTachesTerminees} / {nbTachesTotal}</div>
            <div className="stat-label">Tâches terminées</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.12)', color: 'var(--accent-blue)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{nbTachesEnCours}</div>
            <div className="stat-label">Tâches en cours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent-indigo)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{nbCollaborateurs}</div>
            <div className="stat-label">Collaborateurs</div>
          </div>
        </div>
      </div>

      {/* Section Principale */}
      <div className="row g-4">
        
        {/* Liste des Projets Récents */}
        <div className="col-lg-8">
          <div className="card bg-white border border-light-subtle rounded-4 p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="h5 fw-bold text-dark mb-0">Mes Projets</h2>
              <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setVueActive('projets')}>
                Voir tout <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {projets.map((projet) => {
                const tachesProjet = taches.filter(t => t.projetId === projet.id);
                const terminees = tachesProjet.filter(t => t.statut === 'TERMINE').length;
                const progression = tachesProjet.length > 0 ? Math.round((terminees / tachesProjet.length) * 100) : 0;

                return (
                  <div 
                    key={projet.id} 
                    className="p-3 rounded-3 border border-light-subtle bg-light hover-shadow"
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => {
                      setProjetFiltreId(projet.id);
                      setVueActive('kanban');
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold text-dark">{projet.titre}</div>
                      <span className={`badge ${projet.statut === 'TERMINE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {projet.statut.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="fs-7 text-secondary mb-3">
                      {projet.description}
                    </div>
                    <div>
                      <div className="d-flex justify-content-between fs-8 text-muted mb-1">
                        <span className="fw-semibold">Avancement des tâches</span>
                        <span className="fw-bold text-dark">{terminees} / {tachesProjet.length} tâches ({progression}%)</span>
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fil d'activités */}
        <div className="col-lg-4">
          <div className="card bg-white border border-light-subtle rounded-4 p-4 shadow-sm h-100">
            <div className="d-flex align-items-center gap-2 mb-4">
              <Activity size={20} className="text-warning" />
              <h2 className="h5 fw-bold text-dark mb-0">Activités récentes</h2>
            </div>

            <div className="d-flex flex-column gap-3">
              {activites.map((act) => {
                const membre = membres.find(m => m.id === act.membreId) || { prenom: 'Utilisateur', nom: '' };
                const dateFormatee = new Date(act.dateAction).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={act.id} className="d-flex gap-3 fs-7 pb-3 border-bottom border-light-subtle">
                    <div className="rounded-circle bg-warning p-1 mt-1" style={{ width: '8px', height: '8px', flexShrink: 0 }}></div>
                    <div>
                      <div className="text-dark"><strong className="fw-semibold">{membre.prenom} {membre.nom}</strong> {act.action}</div>
                      <div className="fs-8 text-muted mt-1">À {dateFormatee}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
