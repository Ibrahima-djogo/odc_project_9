import React, { useState } from 'react';
import { Plus, Mail, FolderKanban } from 'lucide-react';
import ModalMembre from './ModalMembre';

export default function ListeMembres({ membres, projets, taches, surSauvegarderMembre, utilisateurConnecte }) {
  const [modalOuverte, setModalOuverte] = useState(false);
  const [membreEdite, setMembreEdite] = useState(null);
  const [projetFiltre, setProjetFiltre] = useState('');

  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  const estChef = estAdmin;

  const ouvrirModal = (membre = null) => {
    setMembreEdite(membre);
    setModalOuverte(true);
  };

  const membresAffiches = membres.filter(m => {
    // L'utilisateur connecté ne voit pas son propre profil dans cette liste
    // de "collaborateurs" (quel que soit son rôle).
    if (m.id === utilisateurConnecte?.id) {
      return false;
    }
    if (projetFiltre && (!m.projetIds || !m.projetIds.includes(projetFiltre))) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Équipes & Membres par Projet</h1>
          <p className="text-secondary mb-0">
            {estChef
              ? 'Gérez les collaborateurs et leurs affectations multiples aux projets'
              : 'Consultez les membres de l\'équipe (lecture seule)'}
          </p>
        </div>
        
        <div className="d-flex align-items-center gap-2 flex-wrap flex-shrink-0">
          <select 
            className="form-select bg-white text-dark border-light-subtle shadow-sm" 
            style={{ width: 'auto', minWidth: '180px', maxWidth: '240px' }}
            value={projetFiltre}
            onChange={(e) => setProjetFiltre(e.target.value)}
          >
            <option value="">Tous les projets</option>
            {projets.map(p => (
              <option key={p.id} value={p.id}>{p.titre}</option>
            ))}
          </select>

          {/* Bouton "Nouveau Membre" uniquement pour les Chefs de Projet */}
          {estChef && (
            <button className="btn btn-warning fw-bold text-dark d-flex align-items-center gap-2 shadow-sm text-nowrap px-3" onClick={() => ouvrirModal(null)}>
              <Plus size={18} />
              <span>Nouveau Membre</span>
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {membresAffiches.map(membre => {
          // Récupérer la liste de tous les projets assignés à ce collaborateur
          const projetsAssignes = projets.filter(p => membre.projetIds && membre.projetIds.includes(p.id));
          const tachesMembre = taches.filter(t => t.membreAssigneId === membre.id);
          const terminees = tachesMembre.filter(t => t.statut === 'TERMINE').length;

          return (
            <div key={membre.id} className="col-md-6 col-lg-3">
              <div className="card bg-white border border-light-subtle rounded-4 h-100 text-dark shadow-sm text-center p-3">
                <div className="card-body d-flex flex-column align-items-center">
                  <img
                    src={membre.avatarUrl}
                    alt={membre.prenom}
                    className="rounded-circle border border-warning p-1 mb-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <h5 className="card-title fw-bold text-dark mb-3">{membre.prenom} {membre.nom}</h5>

                  {/* Affichage multiple des projets */}
                  <div className="d-flex flex-wrap justify-content-center gap-1 mb-3 w-100" style={{ minHeight: '30px' }}>
                    {projetsAssignes.length === 0 ? (
                      <span className="badge bg-light text-secondary border border-light-subtle fs-8">
                        Aucun projet affecté
                      </span>
                    ) : (
                      projetsAssignes.map(p => (
                        <span 
                          key={p.id} 
                          className="badge bg-light text-secondary border border-light-subtle fs-8 d-inline-flex align-items-center gap-1 text-truncate" 
                          title={p.titre}
                          style={{ maxWidth: '100%' }}
                        >
                          <FolderKanban size={10} className="text-warning" style={{ flexShrink: 0 }} />
                          <span className="text-truncate" style={{ maxWidth: '100px' }}>{p.titre}</span>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-2 text-secondary fs-7 mb-3 w-100 justify-content-center">
                    <Mail size={14} className="text-muted" />
                    <span className="text-truncate" style={{ maxWidth: '180px' }} title={membre.email}>{membre.email}</span>
                  </div>

                  <div className="w-100 bg-light rounded-3 p-2 mt-auto border border-light-subtle">
                    <div className="d-flex justify-content-between fs-8 text-dark mb-1">
                      <span>Tâches attribuées</span>
                      <span className="fw-bold">{tachesMembre.length}</span>
                    </div>
                    <div className="d-flex justify-content-between fs-8 text-success">
                      <span>Complétées</span>
                      <span className="fw-bold">{terminees}</span>
                    </div>
                  </div>
                </div>

                {/* Bouton "Modifier les infos" uniquement pour les Chefs de Projet */}
                {estChef && (
                  <div className="card-footer bg-transparent border-0 p-2">
                    <button className="btn btn-sm btn-outline-secondary w-100 fs-8 fw-semibold" onClick={() => ouvrirModal(membre)}>
                      Modifier les infos
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {membresAffiches.length === 0 && (
          <div className="col-12">
            <div className="text-center text-muted py-5 border border-dashed rounded-4 bg-white">
              Aucun membre ne correspond aux critères.
            </div>
          </div>
        )}
      </div>

      {estChef && modalOuverte && (
        <ModalMembre
          membreEdite={membreEdite}
          projets={projets}
          surFermer={() => setModalOuverte(false)}
          surSauvegarder={(m) => {
            surSauvegarderMembre(m);
            setModalOuverte(false);
          }}
        />
      )}
    </div>
  );
}
