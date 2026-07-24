import React, { useState, useEffect } from 'react';
import { obtenirUrlGravatar, obtenirUrlInitials, AVATARS_PREDEFINIS } from '../utils/avatarHelper';
import { Image, Check } from 'lucide-react';

export default function ModalMembre({ membreEdite, surFermer, surSauvegarder }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  // Rôle de sécurité applicative globale : ADMIN ou MEMBRE. La fonction sur
  // un projet précis (Développeur, Designer, Testeur...) ne se gère plus ici
  // — elle se décide désormais uniquement via le système d'invitation par
  // e-mail, depuis la fiche de chaque projet (ProjectDetails.jsx).
  const [roleGlobal, setRoleGlobal] = useState('MEMBRE');

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
      setTypeAvatar('initials');
      setAvatarPredefiniUrl(AVATARS_PREDEFINIS[0].url);
      setAvatarCustomUrl('');
    }
  }, [membreEdite]);

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
                      Pour l'affecter à un projet, invitez-le ensuite par e-mail depuis la fiche du projet concerné.
                    </div>
                  </div>
                )}

                {/* Rôle de sécurité global : uniquement modifiable sur un membre déjà
                    existant, jamais à la création. Un nouveau compte est toujours créé
                    MEMBRE (le backend l'impose de toute façon) ; la promotion ADMIN se
                    décide ensuite, séparément, par un administrateur. */}
                {membreEdite && (
                  <div className="col-md-6">
                    <label className="form-label fs-7 text-secondary fw-semibold">Rôle de sécurité</label>
                    <select
                      className="form-select bg-white text-dark border-light-subtle"
                      value={roleGlobal}
                      onChange={(e) => setRoleGlobal(e.target.value)}
                    >
                      <option value="MEMBRE">Membre</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                    <div className="form-text fs-8">
                      Détermine les droits globaux (Admin = accès à tout). Indépendant de sa fonction par projet,
                      qui se gère désormais depuis la fiche de chaque projet.
                    </div>
                  </div>
                )}

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
