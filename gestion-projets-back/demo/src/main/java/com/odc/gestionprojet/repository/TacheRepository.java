package com.odc.gestionprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.odc.gestionprojet.entity.Tache;

import java.util.List;

/**
 * Repository pour l'entite Tache.
 */
public interface TacheRepository extends JpaRepository<Tache, Long> {

    /**
     * Recupere toutes les taches d'un projet donne.
     * C'est la methode qu'on utilisera le plus souvent : afficher
     * les taches quand on ouvre un projet.
     */
    List<Tache> findByProjetId(Long projetId);

    /**
     * Recupere toutes les taches assignees a un utilisateur donne,
     * tous projets confondus. Utile pour un dashboard personnel
     * ("mes taches a faire").
     */
    List<Tache> findByAssigneAId(Long utilisateurId);

    /**
     * Recupere les taches d'un projet filtrees par statut
     * (utile pour afficher les colonnes "a faire" / "en cours" / "termine").
     */
    List<Tache> findByProjetIdAndStatut(Long projetId, String statut);

    /**
     * Compte le nombre de taches d'un projet ayant un statut donne.
     * Utile pour le dashboard de suivi (ex: "4 taches terminees sur 10").
     */
    long countByProjetIdAndStatut(Long projetId, String statut);

    long countByProjetId(Long projetId);
}
