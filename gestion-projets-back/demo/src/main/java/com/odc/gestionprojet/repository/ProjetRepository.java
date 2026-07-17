package com.odc.gestionprojet.repository;

import com.odc.gestionprojet.entity.Projet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository pour l'entite Projet.
 */
public interface ProjetRepository extends JpaRepository<Projet, Long> {

    /**
     * Recupere tous les projets crees par un utilisateur donne.
     * Equivalent SQL : SELECT * FROM projets WHERE id_createur = ?
     *
     * Remarque : "Createur" ici correspond au nom du champ "createur"
     * dans la classe Projet, pas au nom de la colonne en base.
     */
    List<Projet> findByCreateurId(Long createurId);

    /**
     * Recupere tous les projets ayant un statut donne (ex: "EN_COURS").
     */
    List<Projet> findByStatut(String statut);

    /**
     * Recupere tous les projets dont un utilisateur donne est membre
     * (createur OU simple membre). Necessite une requete un peu plus
     * specifique, donc on l'ecrit nous-memes avec @Query (JPQL, proche
     * du SQL mais qui travaille sur les entites Java plutot que les tables).
     */
    @Query(
        "SELECT DISTINCT p FROM Projet p LEFT JOIN p.membres m " +
        "WHERE p.createur.id = :utilisateurId OR m.utilisateur.id = :utilisateurId"
    )
    List<Projet> findProjetsAccessiblesParUtilisateur(@Param("utilisateurId") Long utilisateurId);
}
