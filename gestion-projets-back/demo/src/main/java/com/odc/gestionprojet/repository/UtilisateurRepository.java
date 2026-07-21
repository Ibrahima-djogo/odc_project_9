package com.odc.gestionprojet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.odc.gestionprojet.entity.Utilisateur;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entite Utilisateur.
 *
 * JpaRepository<Utilisateur, Long> nous donne deja gratuitement :
 * save(), findById(), findAll(), deleteById(), count(), etc.
 *
 * On ajoute ici les methodes specifiques dont on aura besoin.
 */
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    /**
     * Recherche un utilisateur par son email.
     * Indispensable pour le login : on cherchera l'utilisateur par email,
     * puis on comparera le mot de passe.
     *
     * Spring Data JPA comprend automatiquement "findByEmail" et genere
     * la requete SQL equivalente a :
     * SELECT * FROM utilisateurs WHERE email = ?
     */
    Optional<Utilisateur> findByEmail(String email);

    /**
     * Verifie si un email existe deja en base.
     * Utile lors de l'inscription, pour refuser un email deja pris
     * sans avoir a recuperer l'utilisateur complet.
     */
    boolean existsByEmail(String email);

    /**
     * Retourne les utilisateurs qui partagent au moins un projet avec
     * l'utilisateur donne (hors lui-meme). Sert a restreindre la visibilite
     * des collaborateurs : un MEMBRE/CHEF_PROJET ne doit voir que les
     * personnes avec qui il a un projet en commun (l'ADMIN voit tout le
     * monde, via findAll()).
     */
    @Query("SELECT DISTINCT u FROM Utilisateur u " +
           "JOIN u.participations mp " +
           "WHERE mp.projet.id IN (" +
           "  SELECT mp2.projet.id FROM MembreProjet mp2 WHERE mp2.utilisateur.id = :userId" +
           ") AND u.id <> :userId")
    List<Utilisateur> findCollaborateursPartageantUnProjet(@Param("userId") Long userId);

    /**
     * Compte le nombre d'utilisateurs ayant un roleGlobal precis.
     * Utilise uniquement dans AuthService.register() pour detecter
     * l'absence totale d'ADMIN (cas bootstrap).
     */
    long countByRoleGlobal(String roleGlobal);
}
