import React, { useState, useEffect } from 'react';
import { obtenirUrlGravatar, obtenirUrlInitials, AVATARS_PREDEFINIS } from '../utils/avatarHelper';
import { Image, Check } from 'lucide-react';

// Fonctions/rôles possibles sur UN projet donné (indépendant du rôle de sécurité).
const OPTIONS_ROLE_PROJET = [
  { value: 'MEMBRE', label: 'Membre' },
  { value: 'CHEF_PROJET', label: 'Chef de Projet' },
  { value: 'DEVELOPPEUR', label: 'Développeur' },
  { value: 'DESIGNER', label: 'UI/UX Designer' },
  { value: 'TESTEUR', label: 'QA / Testeur' },
];

export default function ModalMembre({ membreEdite, projets = [], surFermer, surSauvegarder }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  // Rôle de sécurité applicative globale : ADMIN ou MEMBRE. Distinct de la
  // fonction sur chaque projet (voir projetRoles), qui n'a aucun impact sur
  // les droits d'accès.
  const [roleGlobal, setRoleGlobal] = useState('MEMBRE');
  const [projetIds, setProjetIds] = useState([]);
  // Fonction de ce membre sur CHAQUE projet coché, ex: { '3': 'DEVELOPPEUR' }
  const [projetRoles, setProjetRoles] = useState({});

  // States pour la gestion de l'avatar
  const [typeAvatar, setTypeAvatar] = useState('initials'); // 'gravatar' | 'initials' | 'predefini' | 'custom'
  const [avatarPredefiniUrl, setAvatarPredefiniUrl] = useState(AVATARS_PREDEFINIS[0].url);
  const [avatarCustomUrl, setAvatarCustomUrl] = useState('');

  useEffect(() => {
    if (membreEdite) {
      setNom(membreEdite.nom || '');
      setPrenom(membreEdite.prenom || '');
      setEmail(membreEdite.email || '');
      setRoleGlobal(membreEdite.roleGlobal === 'ADMIN' ? 'ADMIN' : 'MEMBRE');

      // Initialiser les projets affectés et la fonction sur chacun d'eux
      const idsInitiaux = membreEdite.projetIds ? [...membreEdite.projetIds] : [];
      setProjetIds(idsInitiaux);
      setProjetRoles({ ...(membreEdite.projetRoles || {}) });

      // Reconstruire l'état d'avatar
      const url = membreEdite.avatarUrl || '';
      if (url.includes('gravatar.com')) {
        setTypeAvatar('gravatar');
      } else if (url.includes('ui-avatars.com')) {
        setTypeAvatar('initials');
      } else if (AVATARS_PREDEFINIS.some(av => av.url === url)) {
        setTypeAvatar('predefini');
        setAvatarPredefiniUrl(url);
      } else {
        setTypeAvatar('custom');
        setAvatarCustomUrl(url);
      }
    } else {
      setNom('');
      setPrenom('');
      setEmail('');
      setMotDePasse('');
      setRoleGlobal('MEMBRE');
      const premierProjetId = projets[0] ? [projets[0].id] : [];
      setProjetIds(premierProjetId);
      setProjetRoles(premierProjetId.length ? { [premierProjetId[0]]: 'MEMBRE' } : {});
      setTypeAvatar('initials');
      setAvatarPredefiniUrl(AVATARS_PREDEFINIS[0].url);
      setAvatarCustomUrl('');
    }
  }, [membreEdite, projets]);

  // URL d'avatar final basé sur la sélection réactive
  const obtenirAvatarUrlFinal = () => {
    switch (typeAvatar) {
      case 'gravatar':
        return obtenirUrlGravatar(email);
      case 'predefini':
        return avatarPredefiniUrl;
      case 'custom':
        return avatarCustomUrl.trim() || obtenirUrlInitials(prenom, nom);
      case 'initials':
      default:
        return obtenirUrlInitials(prenom, nom);
    }
  };

  const gererClicProjet = (id) => {
    if (projetIds.includes(id)) {
      setProjetIds(projetIds.filter(pId => pId !== id));
    } else {
      setProjetIds([...projetIds, id]);
      // Fonction par défaut pour un projet qu'on vient de cocher
      setProjetRoles(prev => (prev[id] ? prev : { ...prev, [id]: 'MEMBRE' }));
    }
  };

  const changerRoleProjet = (id, nouveauRole) => {
    setProjetRoles(prev => ({ ...prev, [id]: nouveauRole }));
  };

  const soumettre = (e) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !email.trim()) return;

    // Validation du mot de passe uniquement pour un nouveau membre
    if (!membreEdite && motDePasse.trim().length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    surSauvegarder({
      ...(membreEdite || {}),
      nom,
      prenom,
      email: email.trim().toLowerCase(),
      motDePasse: motDePasse.trim() || undefined, // uniquement pour la création
      roleGlobal,
      projetIds,
      projetRoles,
      avatarUrl: obtenirAvatarUrlFinal()
    });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div className="modal-content bg-white text-dark border-light-subtle rounded-4 shadow-lg">
          <div className="modal-header border-bottom border-light-subtle">
            <h5 className="modal-title fw-bold text-dark">{membreEdite ? 'Modifier le Membre' : 'Ajouter un Membre'}</h5>
            <button type="button" className="btn-close" onClick={surFermer}></button>
          </div>
          <form onSubmit={soumettre}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Prénom *</label>
                  <input
                    type="text"
                    className="form-control bg-white text-dark border-light-subtle"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Nom *</label>
                  <input
                    type="text"
                    className="form-control bg-white text-dark border-light-subtle"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fs-7 text-secondary fw-semibold">Adresse Email *</label>
                  <input
                    type="email"
                    className="form-control bg-white text-dark border-light-subtle"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Champ mot de passe — uniquement à la création */}
                {!membreEdite && (
                  <div className="col-12">
                    <label className="form-label fs-7 text-secondary fw-semibold">
                      Mot de passe initial *
                    </label>
                    <input
                      type="text"
                      className="form-control bg-white text-dark border-light-subtle fw-bold"
                      placeholder="Ex: Odc@2025 (min. 6 caractères)"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      required={!membreEdite}
                      minLength={6}
                    />
                    <div className="form-text fs-8">
                      Ce mot de passe sera communiqué au membre pour sa première connexion.
                    </div>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Rôle de sécurité</label>
                  <select
                    className="form-select bg-white text-dark border-light-subtle"
                    value={roleGlobal}
                    onChange={(e) => setRoleGlobal(e.target.value)}
                  >
                    <option value="MEMBRE">Membre</option>
                    <option value="ADMIN">Administrateur</option>
                    <option value="CHEF_DE_PROJET">Chef de Projet</option>
                  </select>
                  <div className="form-text fs-8">
                    Détermine les droits globaux (Admin = accès à tout). Indépendant de sa fonction par projet ci-dessous.
                  </div>
                </div>

                {/* Section Affectation à Plusieurs Projets, avec fonction par projet */}
                <div className="col-12 mt-2">
                  <label className="form-label fs-7 text-secondary fw-semibold mb-2">
                    Affecté aux Projets (Sélection multiple)
                  </label>
                  {projets.length === 0 ? (
                    <div className="text-muted fs-8">Aucun projet créé pour le moment.</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded-3 border border-light-subtle" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {projets.map(p => {
                        const estCoche = projetIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => gererClicProjet(p.id)}
                            className={`d-flex align-items-center gap-2 p-2 rounded-pill border cursor-pointer select-none transition-all fs-8 ${estCoche ? 'bg-warning-subtle text-dark border-warning fw-semibold' : 'bg-white text-secondary border-light-subtle'}`}
                          >
                            <span>{p.titre}</span>
                            <input
                              type="checkbox"
                              className="form-check-input m-0 border-secondary"
                              checked={estCoche}
                              onChange={() => {}} // géré par clic sur le badge
                              style={{ width: '12px', height: '12px' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fonction sur chaque projet coché */}
                  {projetIds.length > 0 && (
                    <div className="mt-3 d-flex flex-column gap-2 p-3 bg-light rounded-3 border border-light-subtle">
                      <label className="form-label fs-8 text-secondary fw-semibold mb-1">
                        Fonction sur chaque projet
                      </label>
                      {projetIds.map(pId => {
                        const projet = projets.find(p => p.id === pId);
                        if (!projet) return null;
                        return (
                          <div key={pId} className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-1 gap-sm-2 pb-2 pb-sm-0 border-bottom border-light-subtle border-bottom-sm-0">
                            <span
                              className="fs-8 text-dark fw-medium text-truncate w-100 w-sm-auto"
                              style={{ maxWidth: '200px' }}
                              title={projet.titre}
                            >
                              {projet.titre}
                            </span>
                            <select
                              className="form-select form-select-sm bg-white text-dark border-light-subtle w-100 w-sm-auto flex-grow-1"
                              value={projetRoles[pId] || 'MEMBRE'}
                              onChange={(e) => changerRoleProjet(pId, e.target.value)}
                            >
                              {OPTIONS_ROLE_PROJET.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section Configuration de l'Avatar / Photo de profil */}
                <div className="col-12 mt-3 pt-3 border-top border-light-subtle">
                  <label className="form-label fs-7 text-secondary fw-semibold d-flex align-items-center gap-1">
                    <Image size={16} /> Photo de profil
                  </label>

                  <div className="btn-group avatar-btn-group w-100 mb-3" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'initials' ? 'active bg-dark text-white' : ''}`}
                      onClick={() => setTypeAvatar('initials')}
                    >
                      Initiales auto
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'gravatar' ? 'active bg-dark text-white' : ''}`}
                      onClick={() => setTypeAvatar('gravatar')}
                    >
                      Gravatar (Email)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'predefini' ? 'active bg-dark text-white' : ''}`}
                      onClick={() => setTypeAvatar('predefini')}
                    >
                      Galerie photos
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'custom' ? 'active bg-dark text-white' : ''}`}
                      onClick={() => setTypeAvatar('custom')}
                    >
                      URL personnalisée
                    </button>
                  </div>

                  {/* Galerie prédéfinie */}
                  {typeAvatar === 'predefini' && (
                    <div className="d-flex flex-wrap gap-2 justify-content-center p-2 border rounded-3 bg-light mb-3" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                      {AVATARS_PREDEFINIS.map(av => (
                        <div
                          key={av.id}
                          className="position-relative rounded-circle overflow-hidden border border-2 cursor-pointer"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderColor: avatarPredefiniUrl === av.url ? '#ff7900' : 'transparent'
                          }}
                          onClick={() => setAvatarPredefiniUrl(av.url)}
                        >
                          <img src={av.url} alt={av.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {avatarPredefiniUrl === av.url && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-warning opacity-25 d-flex align-items-center justify-content-center">
                              <Check size={14} className="text-dark fw-bold" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* URL personnalisée */}
                  {typeAvatar === 'custom' && (
                    <input
                      type="url"
                      className="form-control bg-white text-dark border-light-subtle fs-7 mb-3"
                      placeholder="Coller l'adresse URL de l'image (https://...)"
                      value={avatarCustomUrl}
                      onChange={(e) => setAvatarCustomUrl(e.target.value)}
                    />
                  )}

                  {/* Aperçu en temps réel */}
                  <div className="d-flex flex-column flex-sm-row align-items-center gap-3 p-3 bg-light rounded-3 border border-light-subtle text-center text-sm-start">
                    <img
                      src={obtenirAvatarUrlFinal()}
                      alt="Aperçu du profil"
                      className="rounded-circle border border-warning flex-shrink-0"
                      style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                    />
                    <div>
                      <span className="d-block fw-bold fs-7 text-dark">
                        {prenom.trim() || 'Prénom'} {nom.trim() || 'Nom'}
                      </span>
                      <small className="text-secondary fs-8">
                        Source : {
                          typeAvatar === 'initials' ? 'Initiales auto (UI Avatars)' :
                          typeAvatar === 'gravatar' ? 'Profil Gravatar relié à l\'email' :
                          typeAvatar === 'predefini' ? 'Photo de la galerie prédéfinie' : 'Adresse URL externe'
                        }
                      </small>
                    </div>
                  </div>
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
