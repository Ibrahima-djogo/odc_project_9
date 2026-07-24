package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Apercu PUBLIC d'une invitation (avant connexion/inscription), affiche par
 * le frontend lorsqu'un visiteur ouvre le lien recu par e-mail. Ne leve
 * jamais d'exception : si le token est invalide/expire/revoque/deja
 * accepte, "valide" vaut false et "motifInvalide" explique pourquoi, plutot
 * que de renvoyer une erreur HTTP qui laisserait deviner l'existence ou non
 * du token en base.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvitationPreviewResponse {

    private boolean valide;
    private String motifInvalide;

    private String projetNom;
    private String email;
    private String roleProjet;
    private String inviteParNom;
}
