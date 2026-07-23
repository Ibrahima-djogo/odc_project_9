import React, { useState } from 'react';
import { Search, Plus, LogOut, ChevronDown, Menu, Sparkles } from 'lucide-react';

export default function Navbar({ recherche, setRecherche, surClicNouveauProjet, surClicNouvelleTache, utilisateurConnecte, surDeconnexion, estMobile, surOuvrirSidebar }) {
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';

  // Affiche uniquement le rôle de sécurité global (ADMIN/MEMBRE) : la fonction
  // (Développeur, Designer, Testeur...) est désormais spécifique à chaque
  // projet (membres_projet.role_projet), pas un attribut global de l'utilisateur.
  const obtenirTitreAffiche = () => {
    const rg = utilisateurConnecte?.roleGlobal || 'MEMBRE';
    if (rg === 'SUPER_ADMIN') return 'Super Admin';
    if (rg === 'ADMIN')       return 'Administrateur';
    return 'Membre';
  };

  return (
    <nav className={`navbar navbar-expand-lg bg-white border-bottom sticky-top px-4 py-3 shadow-sm ${estMobile ? 'navbar-mobile-compact' : ''}`} style={{ zIndex: 900 }}>
      {/* Backdrop invisible pour fermer le dropdown au clic extérieur */}
      {dropdownOuvert && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ zIndex: 998, cursor: 'default' }} 
          onClick={() => setDropdownOuvert(false)} 
        />
      )}

      <div className="container-fluid p-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
        
        {/* Bouton Hamburger (mobile uniquement) + Barre de recherche */}
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
          {/* Bouton hamburger + logo WorkPulse : uniquement dans le header mobile */}
          {estMobile && surOuvrirSidebar && (
            <>
              <button
                className="btn-hamburger"
                onClick={surOuvrirSidebar}
                title="Ouvrir le menu"
              >
                <Menu size={20} />
              </button>
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <div
                  className="bg-warning text-dark rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '30px', height: '30px', flexShrink: 0 }}
                >
                  <Sparkles size={16} />
                </div>
                <span className="fw-bold fs-6 text-dark text-nowrap d-none d-sm-inline">WorkPulse</span>
              </div>
            </>
          )}

          {/* Barre de recherche */}
          <div className="input-group" style={{ maxWidth: estMobile ? '100%' : '320px', minWidth: '140px', flex: estMobile ? '1' : 'unset' }}>
            <span className="input-group-text bg-light border-light-subtle text-muted">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control bg-light border-light-subtle fs-7 text-dark"
              placeholder="Rechercher..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
        </div>

        {/* Groupe de boutons d'action */}
        <div className="d-flex align-items-center gap-2 ms-auto" style={{ zIndex: 999 }}>

          {/* Nouvelle Tâche : nécessite d'être Chef d'AU MOINS un projet, mais la
              Navbar n'a pas le contexte des projets pour le vérifier précisément
              (pas de rôle par-projet avant que l'utilisateur n'en gère un) —
              on la réserve donc à l'ADMIN ici ; les chefs d'un projet précis
              disposent déjà de ce bouton en contexte (Kanban filtré, fiche projet). */}
          {estAdmin && (
            <button
              className={`btn btn-warning text-dark fw-bold d-flex align-items-center gap-2 shadow-sm px-3 text-nowrap ${estMobile ? 'btn-hide-text-mobile btn-sm' : ''}`}
              onClick={surClicNouvelleTache}
            >
              <Plus size={18} />
              <span>Nouvelle Tâche</span>
            </button>
          )}

          {/* Nouveau Projet : ouvert à TOUT utilisateur connecté — aucun rôle
              par-projet n'existe avant la création, et le créateur devient
              automatiquement Chef de ce projet précis. */}
          {!estMobile && (
            <button className="btn btn-outline-secondary fw-semibold d-flex align-items-center gap-2 px-3 text-nowrap" onClick={surClicNouveauProjet}>
              <Plus size={18} />
              <span>Nouveau Projet</span>
            </button>
          )}

          {!estMobile && <div className="vr mx-2 d-none d-sm-block" style={{ height: '24px' }}></div>}

          {/* Profil utilisateur dynamique */}
          <div className="position-relative">
            <button 
              className="btn btn-link p-0 d-flex align-items-center gap-2 bg-light border border-light-subtle rounded-pill py-1 px-3 text-decoration-none text-dark hover-shadow"
              onClick={() => setDropdownOuvert(!dropdownOuvert)}
              style={{ transition: 'all 0.2s ease' }}
            >
              <img
                src={utilisateurConnecte?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt="Profil"
                className="rounded-circle border border-warning"
                style={{ width: '34px', height: '34px', objectFit: 'cover' }}
              />
              {!estMobile && (
                <div className="d-none d-md-block text-start">
                  <div className="fw-bold fs-7 text-dark lh-1">{utilisateurConnecte?.prenom} {utilisateurConnecte?.nom}</div>
                  <small className="text-muted fs-8 d-block mt-0.5">
                    {obtenirTitreAffiche()}
                  </small>
                </div>
              )}
              <ChevronDown size={14} className="text-secondary ms-1" />
            </button>

            {/* Menu Déroulant */}
            {dropdownOuvert && (
              <div 
                className="position-absolute end-0 mt-2 card bg-white border border-light-subtle shadow-lg rounded-3 py-1 animate-slide-up"
                style={{ zIndex: 1000, minWidth: '180px' }}
              >
                <div className="px-3 py-2 border-bottom border-light-subtle bg-light rounded-top-3">
                  <div className="fs-8 text-muted">Connecté en tant que</div>
                  <div className="fw-bold text-dark fs-7 text-truncate">{utilisateurConnecte?.email}</div>
                  <div className="fs-8 text-secondary mt-1">
                    {obtenirTitreAffiche()}
                  </div>
                </div>
                <button 
                  className="dropdown-item d-flex align-items-center gap-2 px-3 py-2.5 text-danger border-0 bg-transparent fs-7 fw-semibold"
                  onClick={() => {
                    setDropdownOuvert(false);
                    surDeconnexion();
                  }}
                >
                  <LogOut size={15} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
