package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Objet renvoye au client pour une invitation (liste des invitations en
 * attente d'un projet, ou confirmation de creation). Ne contient JAMAIS le
 * token : celui-ci n'est communique qu'une seule fois, dans le lien de
 * l'e-mail envoye par le serveur.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

    private Long id;
    private Long projetId;
    private String projetNom;
    private String email;
    private String roleProjet;
    private String statut;
    private String inviteParNom;
    private LocalDateTime dateCreation;
    private LocalDateTime dateExpiration;
    private String lienInvitation;
}
