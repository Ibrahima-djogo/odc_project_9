package com.odc.gestionprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.odc.gestionprojet.entity.MembreProjet;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entite MembreProjet (la table de liaison
 * projet <-> utilisateur).
 */
public interface MembreProjetRepository extends JpaRepository<MembreProjet, Long> {

    /**
     * Recupere tous les membres d'un projet donne.
     * Utile pour afficher la liste des membres dans l'interface.
     */
    List<MembreProjet> findByProjetId(Long projetId);

    /**
     * Recupere toutes les participations d'un utilisateur
     * (tous les projets dont il est membre).
     */
    List<MembreProjet> findByUtilisateurId(Long utilisateurId);

    /**
     * Verifie si un utilisateur est deja membre d'un projet donne.
     * Utile avant d'ajouter un membre, pour eviter les doublons
     * (en plus de la contrainte unique qu'on a deja en base).
     */
    Optional<MembreProjet> findByProjetIdAndUtilisateurId(Long projetId, Long utilisateurId);

    boolean existsByProjetIdAndUtilisateurId(Long projetId, Long utilisateurId);

    /**
     * Vérifie si un utilisateur a un rôle/fonction précis sur un projet donné.
     * Ex : existsByProjetIdAndUtilisateurIdAndRoleProjet(1L, 5L, "CHEF_PROJET")
     */
    boolean existsByProjetIdAndUtilisateurIdAndRoleProjet(Long projetId, Long utilisateurId, String roleProjet);
}
