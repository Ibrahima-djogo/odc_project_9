package com.odc.gestionprojet.repository;

import com.odc.gestionprojet.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entite Invitation.
 */
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    /**
     * Recherche par le hash du token recu du client (jamais le token en
     * clair, qui n'est jamais persiste).
     */
    Optional<Invitation> findByTokenHash(String tokenHash);

    /**
     * Recherche une invitation deja EN_ATTENTE pour cet e-mail sur ce
     * projet, afin de la faire pivoter (nouveau token) plutot que d'en
     * creer une deuxieme en doublon.
     */
    Optional<Invitation> findByProjetIdAndEmailIgnoreCaseAndStatut(Long projetId, String email, String statut);

    /**
     * Liste des invitations EN_ATTENTE d'un projet (pour l'ecran "invitations
     * en cours" du chef de projet : relance/revocation).
     */
    List<Invitation> findByProjetIdAndStatutOrderByDateCreationDesc(Long projetId, String statut);
}
