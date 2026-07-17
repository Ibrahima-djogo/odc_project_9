package com.odc.gestionprojet.repository;

import com.odc.gestionprojet.entity.Commentaire;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository pour l'entite Commentaire.
 */
public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {

    /**
     * Recupere tous les commentaires d'une tache donnee,
     * tries du plus ancien au plus recent (ordre naturel de lecture).
     */
    List<Commentaire> findByTacheIdOrderByDateCreationAsc(Long tacheId);
}
