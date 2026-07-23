import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, UserPlus, LogIn, Mail, User, Shield, Image, Check, Key } from 'lucide-react';
import { obtenirUrlGravatar, obtenirUrlInitials, AVATARS_PREDEFINIS } from '../utils/avatarHelper';
import { api } from '../services/api';

/**
 * Composant de connexion et d'inscription.
 * Permet d'authentifier les utilisateurs auprès du serveur Spring Boot
 * et de stocker le token JWT correspondant.
 */
export default function Login({ surConnexion }) {
  // Mode de l'écran : Inscription vs Connexion
  const [estInscription, setEstInscription] = useState(false);
  
  // States pour la connexion manuelle
  const [emailConnexion, setEmailConnexion] = useState('');
  const [passwordConnexion, setPasswordConnexion] = useState('');
  
  // States pour l'inscription d'un nouveau collaborateur
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  // Gestion d'avatar (Stocké dans le state de session pour le design)
  const [typeAvatar, setTypeAvatar] = useState('initials'); // 'gravatar' | 'initials' | 'predefini' | 'custom'
  const [avatarPredefiniUrl, setAvatarPredefiniUrl] = useState(AVATARS_PREDEFINIS[0].url);
  const [avatarCustomUrl, setAvatarCustomUrl] = useState('');
  
  // Message d'erreur d'API
  const [erreur, setErreur] = useState('');

  // Calcule l'URL de l'avatar choisi par l'utilisateur
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

  /**
   * Gère la connexion.
   * Appelle l'API du backend pour valider les identifiants et récupérer le token JWT.
   */
  const gererConnexion = async (e) => {
    e.preventDefault();
    setErreur('');

    if (!emailConnexion.trim() || !passwordConnexion.trim()) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    try {
      // Appel API : stocke le token JWT, puis surConnexion charge le profil via getMoi()
      await api.login(emailConnexion.trim(), passwordConnexion);
      surConnexion(false); // false = connexion (pas une nouvelle inscription)
    } catch (err) {
      setErreur(err.message || 'Identifiants invalides ou serveur indisponible.');
    }
  };

  /**
   * Gère l'inscription d'un nouvel utilisateur auprès de l'API backend.
   */
  const gererInscription = async (e) => {
    e.preventDefault();
    setErreur('');

    if (!prenom.trim() || !nom.trim() || !email.trim() || !motDePasse.trim()) {
      setErreur('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      // Inscription publique : le rôle global n'est jamais choisi ici, un
      // compte créé depuis ce formulaire est toujours MEMBRE (le backend
      // l'impose de toute façon, quoi qu'on envoie). Le token JWT est stocké
      // automatiquement par api.register().
      await api.register(
        nom.trim(),
        prenom.trim(),
        email.trim().toLowerCase(),
        motDePasse
      );

      // surConnexion(true) charge le profil réel depuis /api/utilisateurs/moi
      surConnexion(true); // true = nouvelle inscription
    } catch (err) {
      setErreur(err.message || "Erreur lors de la création du compte.");
    }
  };

  return (
    <div
      className="position-relative"
      style={{
        minHeight: '100dvh',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: '1rem 0.75rem',
      }}
    >
      {/* Cercles de fond d'ambiance design */}
      <div className="position-absolute bg-warning rounded-circle opacity-10" 
        style={{ width: '400px', height: '400px', top: '-10%', left: '-10%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div className="position-absolute bg-info rounded-circle opacity-10" 
        style={{ width: '400px', height: '400px', bottom: '-10%', right: '-10%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <div
        className="card border-0 rounded-4 shadow-2xl bg-white text-dark position-relative"
        style={{
          maxWidth: '480px',
          width: '100%',
          marginTop: 'auto',
          marginBottom: 'auto',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1,
        }}
      >
        
        {/* Header Orange ODC */}
        <div className="bg-warning p-4 text-center text-dark position-relative">
          <div className="d-inline-flex bg-dark text-warning p-2 rounded-3 shadow-sm mb-3">
            <Sparkles size={28} />
          </div>
          <h2 className="fw-bold mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>WorkPulse</h2>
          <p className="fs-7 text-dark-emphasis mb-0">Espace de Gestion Collaborative</p>
        </div>

        <div className="card-body p-3 p-sm-4 p-md-5">
          {erreur && (
            <div className="alert alert-danger fs-7 py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2">
              <span>{erreur}</span>
            </div>
          )}

          {!estInscription ? (
            /* ================= FORMULAIRE DE CONNEXION ================= */
            <form onSubmit={gererConnexion}>
              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                <LogIn size={20} className="text-warning" />
                Se connecter
              </h4>

              <div className="mb-3">
                <label className="form-label fs-7 text-secondary fw-semibold">E-mail</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-light-subtle text-secondary"><Mail size={16} /></span>
                  <input 
                    type="email" 
                    className="form-control bg-light border-light-subtle text-dark" 
                    placeholder="Ex: mamadou.diallo@odc.gn" 
                    value={emailConnexion}
                    onChange={(e) => setEmailConnexion(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="form-label fs-7 text-secondary fw-semibold">Mot de passe</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-light-subtle text-secondary"><Key size={16} /></span>
                  <input 
                    type="password" 
                    className="form-control bg-light border-light-subtle text-dark" 
                    placeholder="Votre mot de passe" 
                    value={passwordConnexion}
                    onChange={(e) => setPasswordConnexion(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm">
                <span>Accéder à l'application</span>
                <ArrowRight size={18} />
              </button>


              <div className="text-center mt-4 pt-3 border-top border-light-subtle">
                <span className="text-muted fs-7">Nouveau sur la plateforme ? </span>
                <button 
                  type="button" 
                  className="btn btn-link text-warning fw-semibold fs-7 p-0 m-0 border-0 align-baseline"
                  onClick={() => { setEstInscription(true); setErreur(''); }}
                >
                  Créer un compte
                </button>
              </div>
            </form>
          ) : (
            /* ================= FORMULAIRE D'INSCRIPTION / SIGN UP ================= */
            <form onSubmit={gererInscription}>
              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center gap-2">
                <UserPlus size={20} className="text-warning" />
                Créer votre compte
              </h4>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Prénom *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-light-subtle text-secondary"><User size={16} /></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-light-subtle text-dark" 
                      placeholder="Jean" 
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label fs-7 text-secondary fw-semibold">Nom *</label>
                  <input 
                    type="text" 
                    className="form-control bg-light border-light-subtle text-dark" 
                    placeholder="Dupont" 
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fs-7 text-secondary fw-semibold">E-mail *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-light-subtle text-secondary"><Mail size={16} /></span>
                  <input 
                    type="email" 
                    className="form-control bg-light border-light-subtle text-dark" 
                    placeholder="jean.dupont@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fs-7 text-secondary fw-semibold">Mot de passe *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-light-subtle text-secondary"><Key size={16} /></span>
                  <input 
                    type="password" 
                    className="form-control bg-light border-light-subtle text-dark" 
                    placeholder="Au moins 6 caractères" 
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Aucune sélection de rôle à l'inscription : un compte créé ici est
                  toujours un compte Membre standard. Le rôle Administrateur et les
                  fonctions par projet (Développeur, Designer, Testeur...) se
                  décident ensuite, depuis l'espace d'administration, une fois la
                  personne affectée à un projet. */}
              <div className="mb-3 p-3 bg-light rounded-3 border border-light-subtle fs-8 text-secondary d-flex align-items-center gap-2">
                <Shield size={16} className="text-warning flex-shrink-0" />
                <span>
                  Un compte créé ici est toujours un compte Membre standard. Les rôles Administrateur et les fonctions par projet
                  (Développeur, Designer, Testeur...) sont attribués depuis l'espace d'administration, une fois affecté à un projet.
                </span>
              </div>

              {/* Sélection d'avatar */}
              <div className="mb-4">
                <label className="form-label fs-7 text-secondary fw-semibold d-flex align-items-center gap-1">
                  <Image size={16} /> Image de profil
                </label>
                
                {/* Sélecteur de source d'avatar */}
                <div className="btn-group avatar-btn-group w-100 mb-3" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'initials' ? 'active bg-dark text-white' : ''}`}
                    onClick={() => setTypeAvatar('initials')}
                  >
                    Initiales
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'gravatar' ? 'active bg-dark text-white' : ''}`}
                    onClick={() => setTypeAvatar('gravatar')}
                  >
                    Gravatar
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'predefini' ? 'active bg-dark text-white' : ''}`}
                    onClick={() => setTypeAvatar('predefini')}
                  >
                    Galerie
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm btn-outline-secondary fs-8 py-1.5 ${typeAvatar === 'custom' ? 'active bg-dark text-white' : ''}`}
                    onClick={() => setTypeAvatar('custom')}
                  >
                    URL
                  </button>
                </div>

                {/* Options dynamiques de l'avatar */}
                {typeAvatar === 'predefini' && (
                  <div className="d-flex flex-wrap gap-2 justify-content-center p-2 border rounded-3 bg-light mb-3" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                    {AVATARS_PREDEFINIS.map(av => (
                      <div 
                        key={av.id} 
                        className="position-relative rounded-circle overflow-hidden border border-2 cursor-pointer"
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          cursor: 'pointer',
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

                {typeAvatar === 'custom' && (
                  <input 
                    type="url" 
                    className="form-control bg-light border-light-subtle text-dark fs-7 mb-3" 
                    placeholder="URL de l'image (https://...)" 
                    value={avatarCustomUrl}
                    onChange={(e) => setAvatarCustomUrl(e.target.value)}
                  />
                )}

                {/* Aperçu en temps réel */}
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border border-light-subtle">
                  <img 
                    src={obtenirAvatarUrlFinal()} 
                    alt="Aperçu" 
                    className="rounded-circle border border-warning"
                    style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                  />
                  <div>
                    <span className="d-block fw-bold fs-7 text-dark">
                      {prenom.trim() || 'Prénom'} {nom.trim() || 'Nom'}
                    </span>
                    <small className="text-secondary fs-8">
                      Avatar actif ({
                        typeAvatar === 'initials' ? 'Initiales générées' :
                        typeAvatar === 'gravatar' ? 'Gravatar' :
                        typeAvatar === 'predefini' ? 'Photo choisie' : 'URL Personnalisée'
                      })
                    </small>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm">
                <span>Créer mon compte & Ouvrir</span>
                <ArrowRight size={18} />
              </button>

              <div className="text-center mt-4 pt-3 border-top border-light-subtle">
                <span className="text-muted fs-7">Déjà inscrit ? </span>
                <button 
                  type="button" 
                  className="btn btn-link text-warning fw-semibold fs-7 p-0 m-0 border-0 align-baseline"
                  onClick={() => { setEstInscription(false); setErreur(''); }}
                >
                  Se connecter
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
