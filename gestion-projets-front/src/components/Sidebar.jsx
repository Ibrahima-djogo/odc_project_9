import React from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Sparkles, ChevronLeft, ChevronRight, Mail, Database, LogOut, X } from 'lucide-react';

export default function Sidebar({ vueActive, setVueActive, estReduit, setEstReduit, surDeconnexion, utilisateurConnecte, estMobile, sidebarMobileOuverte }) {
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  // Export BDD : réservé aux administrateurs globaux (pas de rôle par-projet
  // pertinent pour une exportation qui couvre toute la base).
  const estChef = estAdmin;

  // Affiche uniquement le rôle de sécurité global (ADMIN/MEMBRE) : la fonction
  // (Développeur, Designer, Testeur...) est désormais spécifique à chaque
  // projet (membres_projet.role_projet), pas un attribut global de l'utilisateur.
  const obtenirTitreAffiche = () => {
    const rg = utilisateurConnecte?.roleGlobal || 'MEMBRE';
    if (rg === 'SUPER_ADMIN') return 'Super Admin';
    if (rg === 'ADMIN')       return 'Administrateur';
    return 'Membre';
  };

  const tousLesMenus = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projets', label: 'Mes Projets', icon: FolderKanban },
    { id: 'kanban', label: 'Gestion des Tâches', icon: CheckSquare },
    { id: 'membres', label: 'Équipes & Membres', icon: Users },
    { id: 'mails', label: 'Mails Envoyés', icon: Mail },
    // Export BDD visible uniquement pour les Chefs de Projet
    ...(estChef ? [{ id: 'export', label: 'Export BDD', icon: Database }] : []),
  ];
  const menus = tousLesMenus;

  // Déterminer si la sidebar est en mode réduit (jamais réduit sur mobile)
  const estEffectivementReduit = estMobile ? false : estReduit;
  const largeurSidebar = estEffectivementReduit ? '80px' : '260px';

  // Classes CSS pour le mode mobile
  const classesMobile = estMobile
    ? `sidebar-mobile ${sidebarMobileOuverte ? 'open' : ''}`
    : '';

  return (
    <div 
      className={`bg-white border-end vh-100 position-fixed d-flex flex-column p-3 shadow-sm ${classesMobile}`}
      style={{ 
        width: largeurSidebar, 
        zIndex: estMobile ? 1001 : 1000,
        transition: estMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header Logo & Toggle Adaptatif */}
      <div className={`d-flex align-items-center ${estEffectivementReduit ? 'flex-column gap-2' : 'justify-content-between'} mb-4`}>
        <div className="d-flex align-items-center gap-3 overflow-hidden">
          <div 
            className="bg-warning text-dark p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm" 
            style={{ width: '40px', height: '40px', flexShrink: 0 }}
            title="WorkPulse"
          >
            <Sparkles size={22} />
          </div>
          {!estEffectivementReduit && (
            <div>
              <div className="fw-bold fs-5 text-dark lh-1 text-nowrap">WorkPulse</div>
              <small className="text-muted fs-8 text-nowrap">Gestion Collaborative</small>
            </div>
          )}
        </div>

        {/* Sur mobile : bouton X pour fermer, sur desktop : toggle réduire/agrandir */}
        {estMobile ? (
          <button 
            className="btn btn-sm btn-light border-light-subtle rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm"
            onClick={() => setVueActive(vueActive)} // Fermer via le parent (setVueActive trigger close)
            title="Fermer le menu"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        ) : (
          <button 
            className="btn btn-sm btn-light border-light-subtle rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm"
            onClick={() => setEstReduit(!estReduit)}
            title={estReduit ? "Agrandir le menu" : "Réduire le menu"}
            style={{ width: '28px', height: '28px' }}
          >
            {estReduit ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        {menus.map((menu) => {
          const IconeComponent = menu.icon;
          const estActif = vueActive === menu.id;
          return (
            <li key={menu.id} className="nav-item">
              <button
                className={`nav-link w-100 d-flex align-items-center ${estEffectivementReduit ? 'justify-content-center px-0' : 'justify-content-start px-3'} gap-3 py-2 fw-semibold ${
                  estActif ? 'active bg-warning text-dark shadow-sm' : 'text-secondary bg-transparent'
                }`}
                onClick={() => setVueActive(menu.id)}
                title={estEffectivementReduit ? menu.label : ''}
              >
                <IconeComponent size={20} style={{ flexShrink: 0 }} />
                {!estEffectivementReduit && <span className="text-nowrap">{menu.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom Profile and Logout Section */}
      <div className="mt-auto pt-3 border-top border-light-subtle d-flex flex-column gap-2">
        {!estEffectivementReduit && utilisateurConnecte && (
          <div className="d-flex align-items-center gap-2 p-2 bg-light rounded-3 border border-light-subtle text-truncate">
            <img 
              src={utilisateurConnecte.avatarUrl} 
              alt={utilisateurConnecte.prenom} 
              className="rounded-circle border border-warning"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
            <div className="text-truncate">
              <div className="fw-bold fs-8 text-dark lh-1 text-truncate">{utilisateurConnecte.prenom} {utilisateurConnecte.nom}</div>
              <small className="text-muted fs-9 text-truncate d-block mt-0.5">
                {obtenirTitreAffiche()}
              </small>
            </div>
          </div>
        )}

        <button 
          className={`btn btn-link text-danger w-100 d-flex align-items-center ${estEffectivementReduit ? 'justify-content-center px-0' : 'justify-content-start px-3'} gap-3 py-2 fw-semibold border-0 text-decoration-none hover-bg-light rounded-3`}
          onClick={surDeconnexion}
          title="Se déconnecter"
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!estEffectivementReduit && <span className="text-nowrap">Se déconnecter</span>}
        </button>
      </div>
    </div>
  );
}
