import { md5 } from './md5';

// Liste de photos de profil professionnelles d'Unsplash prédéfinies
export const AVATARS_PREDEFINIS = [
  {
    id: 'unsplash1',
    nom: 'Femme - Profil 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash2',
    nom: 'Homme - Profil 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash3',
    nom: 'Femme - Profil 2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash4',
    nom: 'Homme - Profil 2',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash5',
    nom: 'Femme - Profil 3',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash6',
    nom: 'Homme - Profil 3',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash7',
    nom: 'Femme - Profil 4',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'unsplash8',
    nom: 'Homme - Profil 4',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  }
];

// Récupère l'URL Gravatar à partir d'un e-mail
export function obtenirUrlGravatar(email) {
  if (!email || !email.trim()) return '';
  const emailNettoye = email.trim().toLowerCase();
  const hash = md5(emailNettoye);
  return `https://www.gravatar.com/avatar/${hash}?s=150&d=identicon`;
}

// Récupère l'URL des initiales (UI Avatars) à partir du prénom et du nom
export function obtenirUrlInitials(prenom, nom) {
  const p = prenom ? prenom.trim() : '';
  const n = nom ? nom.trim() : '';
  const nomComplet = encodeURIComponent(`${p} ${n}`);
  // Utilisation d'un jeu de couleurs ODC orange (background=ff7900) ou aléatoire
  return `https://ui-avatars.com/api/?name=${nomComplet}&background=ff7900&color=ffffff&size=150&font-size=0.33&bold=true`;
}

// Fonction pour déterminer automatiquement l'avatar par défaut ou l'avatar Gravatar
export function obtenirAvatarDefaut(email, prenom, nom) {
  if (email && email.includes('@')) {
    return obtenirUrlGravatar(email);
  }
  return obtenirUrlInitials(prenom, nom);
}
