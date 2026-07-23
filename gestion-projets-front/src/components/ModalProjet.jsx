import React, { useState, useEffect } from 'react';

export default function ModalProjet({ projetEdite, membres = [], surFermer, surSauvegarder, utilisateurConnecte }) {
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  // À la création (projetEdite absent), n'importe quel utilisateur devient
  // automatiquement Chef du projet qu'il crée : le formulaire complet (budget,
  // nomination du chef) lui est donc ouvert. En modification, seul l'ADMIN ou
  // le Chef de CE projet précis (userHasManagerRights, calculé côté backend) y a accès.
  const estChef = !projetEdite || estAdmin || projetEdite?.userHasManagerRights === true;
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('Web App');
  const [autreCategorie, setAutreCategorie] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statut, setStatut] = useState('EN_COURS');
  const [budget, setBudget] = useState('');
  const [membreIdsAffectes, setMembreIdsAffectes] = useState([]);
  const [chefDeProjetId, setChefDeProjetId] = useState('');

  const categoriesPredefinies = ['Web App', 'Mobile', 'Design & Web', 'API Backend'];

  useEffect(() => {
    if (projetEdite) {
      setTitre(projetEdite.titre || '');
      setDescription(projetEdite.description || '');
      setDateDebut(projetEdite.dateDebut || '');
      setDateFin(projetEdite.dateFin || '');
      setStatut(projetEdite.statut || 'EN_COURS');
      setBudget(projetEdite.budget != null ? projetEdite.budget : '');

      // Gérer la catégorie
      const cat = projetEdite.categorie || 'Web App';
      if (categoriesPredefinies.includes(cat)) {
        setCategorie(cat);
        setAutreCategorie('');
      } else {
        setCategorie('Autre');
        setAutreCategorie(cat);
      }

      // Membres affectés
      const affectes = membres.filter(m => m.projetIds?.includes(projetEdite.id)).map(m => m.id);
      setMembreIdsAffectes(affectes);
    } else {
      setTitre('');
      setDescription('');
      setCategorie('Web App');
      setAutreCategorie('');
      setDateDebut('');
      setDateFin('');
      setStatut('EN_COURS');
      setBudget('');
      setMembreIdsAffectes([]);
    }
  }, [projetEdite, membres]);

  const gererClicMembre = (id) => {
    if (membreIdsAffectes.includes(id)) {
      setMembreIdsAffectes(membreIdsAffectes.filter(mId => mId !== id));
    } else {
      setMembreIdsAffectes([...membreIdsAffectes, id]);
    }
  };

  const soumettre = (e) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const categorieFinale = categorie === 'Autre' ? (autreCategorie.trim() || 'Autre') : categorie;

    surSauvegarder({
      ...(projetEdite || {}),
      titre,
      description,
      categorie: categorieFinale,
      dateDebut,
      dateFin,
      statut,
      budget: budget !== '' ? parseFloat(budget) : null,
      membreIdsAffectes, // Utilisé par App.jsx pour l'association multiple
      chefDeProjetId     // Utilisé pour nommer le chef de projet à la création
    });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div className="modal-content bg-white text-dark border-light-subtle rounded-4 shadow-lg">
          <div className="modal-header border-bottom border-light-subtle">
            <h5 className="modal-title fw-bold text-dark">{projetEdite ? 'Modifier le Projet' : 'Nouveau Projet'}</h5>
            <button type="button" className="btn-close" onClick={surFermer}></button>
          </div>
          <form onSubmit={soumettre}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fs-7 text-secondary fw-semibold">Titre du Projet *</label>
                  <input
                    type="text"
                    className="form-control bg-white text-dark border-light-subtle"
                    placeholder="Ex: Plateforme E-Learning ODC"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Catégorie</label>
                  <select 
                    className="form-select bg-white text-dark border-light-subtle" 
                    value={categorie} 
                    onChange={(e) => setCategorie(e.target.value)}
                  >
                    <option value="Web App">Web App</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Design & Web">Design & Web</option>
                    <option value="API Backend">API Backend</option>
                    <option value="Autre">Autre...</option>
                  </select>
                </div>

                {categorie === 'Autre' && (
                  <div className="col-md-6">
                    <label className="form-label fs-7 text-secondary fw-semibold">Saisir la catégorie libre *</label>
                    <input
                      type="text"
                      className="form-control bg-white text-dark border-light-subtle"
                      placeholder="Ex: Intelligence Artificielle"
                      value={autreCategorie}
                      onChange={(e) => setAutreCategorie(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="col-12">
                  <label className="form-label fs-7 text-secondary fw-semibold">Description</label>
                  <textarea
                    className="form-control bg-white text-dark border-light-subtle"
                    rows="2"
                    placeholder="Objectifs et détails du projet..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Date de début</label>
                  <input
                    type="date"
                    className="form-control bg-white text-dark border-light-subtle"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Date de fin</label>
                  <input
                    type="date"
                    className="form-control bg-white text-dark border-light-subtle"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>

                <div className={estChef ? 'col-12 col-md-8' : 'col-12'}>
                  <label className="form-label fs-7 text-secondary fw-semibold">Statut</label>
                  <select className="form-select bg-white text-dark border-light-subtle" value={statut} onChange={(e) => setStatut(e.target.value)}>
                    <option value="EN_COURS">En cours</option>
                    <option value="PLANIFIE">Planifié</option>
                    <option value="TERMINE">Terminé</option>
                  </select>
                </div>

                {/* Champ Budget : visible uniquement pour les Chefs de Projet */}
                {estChef && (
                  <div className="col-12 col-md-4">
                    <label className="form-label fs-7 text-secondary fw-semibold">Budget (GNF)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-secondary border-light-subtle">₣</span>
                      <input
                        type="number"
                        className="form-control bg-white text-dark border-light-subtle"
                        placeholder="Ex: 500000"
                        min="0"
                        step="0.01"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Nomination du Chef de Projet (uniquement à la création) */}
                {!projetEdite && (
                  <div className="col-12 border-top border-light-subtle pt-3 mt-3">
                    <label className="form-label fs-7 text-secondary fw-semibold mb-2">
                      Nommer un Chef de Projet pour piloter ce projet
                    </label>
                    <select 
                      className="form-select bg-white text-dark border-light-subtle" 
                      value={chefDeProjetId} 
                      onChange={(e) => setChefDeProjetId(e.target.value)}
                    >
                      <option value="">Moi-même (Par défaut)</option>
                      {membres.map(m => (
                        <option key={m.id} value={m.id}>{m.prenom} {m.nom} ({(m.projetRoles?.[projetEdite?.id] || m.roleGlobal || 'MEMBRE').toString().replace('_', ' ')})</option>
                      ))}
                    </select>
                    <div className="form-text text-muted fs-8">
                      La personne sélectionnée aura les pleins droits (Kanban, équipe) sur ce projet spécifique.
                    </div>
                  </div>
                )}

                {/* Section Affectation Multiple des Membres existants */}
                <div className="col-12 mt-3 pt-3 border-top border-light-subtle">
                  <label className="form-label fs-7 text-secondary fw-semibold mb-2">
                    Affecter des membres existants à ce projet (Association multiple)
                  </label>
                  {membres.length === 0 ? (
                    <div className="text-muted fs-8 py-2">
                      Aucun membre disponible. Vous pourrez créer des membres plus tard.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded-3 border border-light-subtle" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {membres.map(m => {
                        const estCoche = membreIdsAffectes.includes(m.id);
                        return (
                          <div 
                            key={m.id} 
                            onClick={() => gererClicMembre(m.id)}
                            className={`d-flex align-items-center gap-2 p-2 rounded-pill border cursor-pointer select-none transition-all fs-8 ${estCoche ? 'bg-warning-subtle text-dark border-warning fw-semibold' : 'bg-white text-secondary border-light-subtle'}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <img 
                              src={m.avatarUrl} 
                              alt={m.prenom} 
                              className="rounded-circle"
                              style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                            />
                            <span>{m.prenom} {m.nom}</span>
                            <input 
                              type="checkbox" 
                              className="form-check-input m-0 border-secondary"
                              checked={estCoche}
                              onChange={() => {}} // géré par le clic sur le conteneur
                              style={{ width: '12px', height: '12px' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer border-top border-light-subtle">
              <button type="button" className="btn btn-outline-secondary" onClick={surFermer}>Annuler</button>
              <button type="submit" className="btn btn-warning text-dark fw-bold">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
