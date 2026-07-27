import React, { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function ModalTache({ tacheEditee, projets, membres, utilisateurConnecte, surFermer, surSauvegarder, surAjouterCommentaire }) {
  const estAdmin = utilisateurConnecte?.roleGlobal === 'ADMIN' || utilisateurConnecte?.roleGlobal === 'SUPER_ADMIN';
  const estChefGlobal = estAdmin;

  // Tous les projets accessibles par l'utilisateur connecté sont sélectionnables
  const projetsSelectionnables = projets;

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [projetId, setProjetId] = useState(projetsSelectionnables[0]?.id || '');
  const [membreAssigneId, setMembreAssigneId] = useState('');
  const [statut, setStatut] = useState('A_FAIRE');
  const [priorite, setPriorite] = useState('MOYENNE');
  const [dateEcheance, setDateEcheance] = useState('');
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');

  // Filtrer les membres qui appartiennent à ce projet (via leur tableau de projetIds)
  const membresDuProjet = membres.filter(m => m.projetIds && m.projetIds.includes(projetId));

  // Tout membre du projet connecté peut modifier les détails et le statut de la tâche
  const estGestionnaire = true;

  useEffect(() => {
    if (tacheEditee) {
      setTitre(tacheEditee.titre || '');
      setDescription(tacheEditee.description || '');
      setProjetId(tacheEditee.projetId || (projets[0]?.id || ''));
      setMembreAssigneId(tacheEditee.membreAssigneId || '');
      setStatut(tacheEditee.statut || 'A_FAIRE');
      setPriorite(tacheEditee.priorite || 'MOYENNE');
      setDateEcheance(tacheEditee.dateEcheance || '');
    } else {
      if (membresDuProjet.length > 0) {
        setMembreAssigneId(membresDuProjet[0].id);
      } else {
        setMembreAssigneId('');
      }
    }
  }, [tacheEditee, projets]);

  // Si le projet change dans le select, adapter les membres disponibles pour l'assignation
  const lorsChangementProjet = (e) => {
    const nvoProjetId = e.target.value;
    setProjetId(nvoProjetId);
    const membresNvoProjet = membres.filter(m => m.projetIds && m.projetIds.includes(nvoProjetId));
    if (membresNvoProjet.length > 0) {
      setMembreAssigneId(membresNvoProjet[0].id);
    } else {
      setMembreAssigneId('');
    }
  };

  const soumettreFormulaire = (e) => {
    e.preventDefault();
    if (!titre.trim()) return;
    surSauvegarder({
      ...(tacheEditee || {}),
      titre,
      description,
      projetId,
      membreAssigneId,
      statut,
      priorite,
      dateEcheance
    });
  };

  const envoyerCommentaire = (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim() || !tacheEditee?.id) return;
    // Utiliser l'ID de l'utilisateur connecté réel
    surAjouterCommentaire(tacheEditee.id, utilisateurConnecte?.id || 'm1', nouveauCommentaire);
    setNouveauCommentaire('');
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${tacheEditee ? 'modal-lg' : ''}`}>
        <div className="modal-content bg-white text-dark border-light-subtle rounded-4 shadow-lg">
          <div className="modal-header border-bottom border-light-subtle">
            <h5 className="modal-title fw-bold text-dark">
              {!tacheEditee ? 'Nouvelle Tâche' : estGestionnaire ? 'Détails & Édition de la Tâche' : 'Détails de la Tâche'}
            </h5>
            <button type="button" className="btn-close" onClick={surFermer}></button>
          </div>
          
          <div className="modal-body">
            <div className="row g-4">
              {/* Formulaire principal */}
              <div className={tacheEditee ? 'col-md-7' : 'col-12'}>
                {!estGestionnaire && (
                  <div className="alert alert-secondary fs-8 py-2 px-3 mb-3">
                    Lecture seule : seul le Chef de Projet peut modifier les détails de cette tâche.
                    Utilisez les boutons <strong>Avancer / Reculer</strong> du tableau pour en faire évoluer le statut.
                  </div>
                )}
                <form onSubmit={soumettreFormulaire}>
                <fieldset disabled={!estGestionnaire} style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary fw-semibold">Titre de la tâche *</label>
                    <input
                      type="text"
                      className="form-control bg-white text-dark border-light-subtle"
                      placeholder="Ex: Développer les API du panier d'achat"
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary fw-semibold">Projet associé</label>
                    <select className="form-select bg-white text-dark border-light-subtle" value={projetId} onChange={lorsChangementProjet}>
                      {projetsSelectionnables.map(p => (
                        <option key={p.id} value={p.id}>{p.titre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary fw-semibold">Assigner à un membre affecté à ce projet</label>
                    <select className="form-select bg-white text-dark border-light-subtle" value={membreAssigneId} onChange={(e) => setMembreAssigneId(e.target.value)}>
                      {membresDuProjet.length === 0 ? (
                        <option value="">Aucun membre affecté à ce projet</option>
                      ) : (
                        membresDuProjet.map(m => (
                          <option key={m.id} value={m.id}>{m.prenom} {m.nom} ({(m.projetRoles?.[projetId] || m.roleGlobal || 'MEMBRE').toString().replace('_', ' ')})</option>
                        ))
                      )}
                    </select>
                    {membresDuProjet.length === 0 && (
                      <div className="form-text text-warning fs-8 mt-1">
                        Aucun membre n'est lié à ce projet. Associez-y d'abord des collaborateurs dans les projets ou membres.
                      </div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="form-label fs-7 text-secondary fw-semibold">Statut</label>
                      <select className="form-select bg-white text-dark border-light-subtle" value={statut} onChange={(e) => setStatut(e.target.value)}>
                        <option value="A_FAIRE">À faire</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINE">Terminé</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label fs-7 text-secondary fw-semibold">Priorité</label>
                      <select className="form-select bg-white text-dark border-light-subtle" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
                        <option value="BASSE">Basse</option>
                        <option value="MOYENNE">Moyenne</option>
                        <option value="HAUTE">Haute</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary fw-semibold">Date d'échéance</label>
                    <input
                      type="date"
                      className="form-control bg-white text-dark border-light-subtle"
                      value={dateEcheance}
                      onChange={(e) => setDateEcheance(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fs-7 text-secondary fw-semibold">Description</label>
                    <textarea
                      className="form-control bg-white text-dark border-light-subtle"
                      rows="3"
                      placeholder="Spécifications techniques..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </fieldset>

                  <div className="d-flex justify-content-end gap-2 pt-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={surFermer}>
                      {estGestionnaire ? 'Annuler' : 'Fermer'}
                    </button>
                    {estGestionnaire && (
                      <button type="submit" className="btn btn-warning text-dark fw-bold">Enregistrer</button>
                    )}
                  </div>
                </form>
              </div>

              {/* Section Commentaires */}
              {tacheEditee && (
                <div className="col-md-5 border-start-md ps-md-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <MessageSquare size={18} className="text-warning" />
                    <h6 className="fw-bold mb-0 text-dark">Commentaires ({tacheEditee.commentaires?.length || 0})</h6>
                  </div>

                  <div className="flex-grow-1 overflow-auto pe-1 mb-3" style={{ maxHeight: '280px' }}>
                    {(!tacheEditee.commentaires || tacheEditee.commentaires.length === 0) ? (
                      <div className="text-center text-muted fs-7 py-4 border border-dashed rounded-3">
                        Aucun commentaire pour le moment.
                      </div>
                    ) : (
                      tacheEditee.commentaires.map(comm => {
                        const auteur = membres.find(m => m.id === comm.membreId) || { prenom: 'Utilisateur', nom: '' };
                        return (
                          <div key={comm.id} className="p-2 mb-2 bg-light rounded-3 border border-light-subtle">
                            <div className="d-flex justify-content-between fs-8 mb-1">
                              <span className="fw-bold text-warning-emphasis">{auteur.prenom} {auteur.nom}</span>
                              <span className="text-muted">{new Date(comm.dateCreation).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="fs-7 text-dark">{comm.contenu}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={envoyerCommentaire} className="input-group">
                    <input
                      type="text"
                      className="form-control bg-light border-light-subtle fs-7 text-dark"
                      placeholder="Écrire un commentaire..."
                      value={nouveauCommentaire}
                      onChange={(e) => setNouveauCommentaire(e.target.value)}
                    />
                    <button type="submit" className="btn btn-warning text-dark fw-bold">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
