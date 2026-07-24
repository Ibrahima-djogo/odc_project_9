import React, { useState, useEffect } from 'react';

export default function ModalProjet({ projetEdite, surFermer, surSauvegarder, utilisateurConnecte }) {
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  // À la création (projetEdite absent), n'importe quel utilisateur devient
  // automatiquement Chef du projet qu'il crée : le formulaire complet
  // (budget) lui est donc ouvert. En modification, seul l'ADMIN ou le Chef
  // de CE projet précis (userHasManagerRights, calculé côté backend) y a accès.
  const estChef = !projetEdite || estAdmin || projetEdite?.userHasManagerRights === true;
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('Web App');
  const [autreCategorie, setAutreCategorie] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [budget, setBudget] = useState('');

  const categoriesPredefinies = ['Web App', 'Mobile', 'Design & Web', 'API Backend'];

  useEffect(() => {
    if (projetEdite) {
      setTitre(projetEdite.titre || '');
      setDescription(projetEdite.description || '');
      setDateDebut(projetEdite.dateDebut || '');
      setDateFin(projetEdite.dateFin || '');
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
    } else {
      setTitre('');
      setDescription('');
      setCategorie('Web App');
      setAutreCategorie('');
      setDateDebut('');
      setDateFin('');
      setBudget('');
    }
  }, [projetEdite]);

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
      budget: budget !== '' ? parseFloat(budget) : null,
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

                {/* Le statut n'est plus modifiable à la main : il est entièrement
                    calculé côté backend à partir de l'avancement des tâches
                    (PLANIFIE tant qu'aucune n'a démarré, EN_COURS dès qu'une
                    tâche est en cours, TERMINE seulement quand toutes le sont). */}
                <div className={estChef ? 'col-12 col-md-8' : 'col-12'}>
                  <label className="form-label fs-7 text-secondary fw-semibold">Statut</label>
                  <div className="form-control bg-light text-secondary border-light-subtle d-flex align-items-center">
                    {projetEdite
                      ? (projetEdite.statut || 'PLANIFIE').replace('_', ' ')
                      : 'Planifié (calculé automatiquement selon les tâches)'}
                  </div>
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

                {/* Plus de nomination de chef ni d'affectation de membres ici :
                    la création se fait seul (on en devient chef), on invite
                    ensuite par e-mail depuis la fiche du projet. */}
                {!projetEdite && (
                  <div className="col-12 mt-2 p-3 bg-light rounded-3 border border-light-subtle fs-8 text-secondary">
                    Une fois le projet créé, invitez des collaborateurs par e-mail depuis sa fiche détaillée.
                  </div>
                )}
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
