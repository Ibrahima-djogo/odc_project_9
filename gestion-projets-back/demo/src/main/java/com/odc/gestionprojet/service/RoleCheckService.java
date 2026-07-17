package com.odc.gestionprojet.service;

import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service utilitaire centralisant les vérifications de droits d'accès.
 *
 * Trois niveaux de contrôle :
 * 1. ADMIN (roleGlobal) : super-utilisateur, outrepasse systématiquement les deux niveaux suivants.
 * 2. Niveau global (roleGlobal) : CHEF_DE_PROJET ou MEMBRE
 * 3. Niveau projet (rôle dans membres_projet) : CHEF_PROJET sur ce projet précis
 *
 * Attention : le rôle "chef de projet" est stocké différemment selon le niveau :
 * - roleGlobal (table utilisateurs) utilise la valeur "CHEF_DE_PROJET"
 * - MembreProjet.role (table membres_projet) utilise la valeur "CHEF_PROJET"
 * Ne pas confondre les deux littéraux lors de futures évolutions.
 */
@Service
@RequiredArgsConstructor
public class RoleCheckService {

    private static final String ROLE_GLOBAL_ADMIN = "ADMIN";
    private static final String ROLE_GLOBAL_CHEF_DE_PROJET = "CHEF_DE_PROJET";
    private static final String ROLE_PROJET_CHEF_PROJET = "CHEF_PROJET";

    private final UtilisateurRepository utilisateurRepository;
    private final ProjetRepository projetRepository;
    private final MembreProjetRepository membreProjetRepository;

    /**
     * Récupère l'utilisateur connecté depuis le contexte Spring Security.
     */
    public Utilisateur getUtilisateurConnecte() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur connecté introuvable avec l'email : " + email));
    }

    public boolean estAdmin(Utilisateur utilisateur) {
        return ROLE_GLOBAL_ADMIN.equals(utilisateur.getRoleGlobal());
    }

    /**
     * Retourne true si l'utilisateur connecté est ADMIN.
     */
    public boolean estAdminConnecte() {
        return estAdmin(getUtilisateurConnecte());
    }

    /**
     * Vérifie que l'utilisateur connecté peut créer/gérer des projets au niveau
     * global : ADMIN (tous droits) ou CHEF_DE_PROJET. Lève 403 sinon.
     */
    public void exigerChefDeProjetGlobal() {
        Utilisateur u = getUtilisateurConnecte();
        if (estAdmin(u)) {
            return;
        }
        if (!ROLE_GLOBAL_CHEF_DE_PROJET.equals(u.getRoleGlobal())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Action réservée aux Chefs de Projet.");
        }
    }

    /**
     * Retourne true si l'utilisateur connecté est CHEF_PROJET sur le projet
     * donné (ADMIN, créateur du projet, ou rôle CHEF_PROJET dans membres_projet).
     */
    public boolean estChefOuAdminSurProjet(Long projetId) {
        Utilisateur u = getUtilisateurConnecte();

        if (estAdmin(u)) {
            return true;
        }

        var projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));
        if (projet.getCreateur().getId().equals(u.getId())) {
            return true;
        }

        return membreProjetRepository
                .existsByProjetIdAndUtilisateurIdAndRoleProjet(projetId, u.getId(), ROLE_PROJET_CHEF_PROJET);
    }

    /**
     * Vérifie que l'utilisateur connecté est CHEF_PROJET sur le projet donné
     * (ADMIN, créateur du projet, ou rôle CHEF_PROJET dans membres_projet).
     * Lève 403 sinon.
     */
    public void exigerChefDeProjetSurProjet(Long projetId) {
        if (!estChefOuAdminSurProjet(projetId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Action réservée au Chef de Projet de ce projet.");
        }
    }

    /**
     * Retourne true si l'utilisateur connecté est globalement ADMIN ou CHEF_DE_PROJET.
     */
    public boolean estChefDeProjetGlobal() {
        Utilisateur u = getUtilisateurConnecte();
        return estAdmin(u) || ROLE_GLOBAL_CHEF_DE_PROJET.equals(u.getRoleGlobal());
    }
}
