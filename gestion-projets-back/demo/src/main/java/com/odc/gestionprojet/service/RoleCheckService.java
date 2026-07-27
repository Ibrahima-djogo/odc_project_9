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
 * Deux niveaux de contrôle, jamais confondus :
 * 1. roleGlobal (table utilisateurs) : uniquement "ADMIN" ou "MEMBRE". L'ADMIN
 *    est un super-utilisateur qui outrepasse systématiquement le niveau projet.
 * 2. Niveau projet (MembreProjet.roleProjet, table membres_projet) : la
 *    valeur "CHEF_PROJET" y désigne le pilote d'UN projet précis. Un MEMBRE
 *    global peut être CHEF_PROJET sur un projet et simple membre sur un autre.
 *
 * Il n'existe plus de rôle "chef de projet" au niveau global : n'importe quel
 * utilisateur connecté peut créer un projet (voir ProjetController) et en
 * devient alors automatiquement CHEF_PROJET sur CE projet précis.
 */
@Service
@RequiredArgsConstructor
public class RoleCheckService {

    private static final String ROLE_GLOBAL_ADMIN = "ADMIN";
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
     * Retourne true si l'utilisateur donné est membre du projet donné (a une
     * ligne dans membres_projet, quel que soit son rôle sur ce projet).
     * Utilisé pour le modèle "Trello" : tout membre du projet peut faire
     * avancer/reculer le statut de n'importe quelle tâche de ce projet, pas
     * seulement celles qui lui sont assignées.
     */
    /**
     * Retourne true si l'utilisateur donné est membre du projet donné (a une
     * ligne dans membres_projet, quel que soit son rôle sur ce projet).
     * Utilisé pour le modèle "Trello" : tout membre du projet peut faire
     * avancer/reculer le statut de n'importe quelle tâche de ce projet, pas
     * seulement celles qui lui sont assignées.
     */
    public boolean estMembreDuProjet(Long projetId, Long utilisateurId) {
        return membreProjetRepository.existsByProjetIdAndUtilisateurId(projetId, utilisateurId);
    }

    /**
     * Vérifie que l'utilisateur connecté est membre de ce projet (ADMIN,
     * créateur du projet, ou toute personne inscrite dans membres_projet).
     * Lève 403 sinon.
     */
    public void exigerMembreOuChefDeProjet(Long projetId) {
        Utilisateur u = getUtilisateurConnecte();
        if (estAdmin(u)) {
            return;
        }
        var projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));
        if (projet.getCreateur().getId().equals(u.getId())) {
            return;
        }
        if (!membreProjetRepository.existsByProjetIdAndUtilisateurId(projetId, u.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous devez être membre de ce projet pour y effectuer cette action.");
        }
    }
}
