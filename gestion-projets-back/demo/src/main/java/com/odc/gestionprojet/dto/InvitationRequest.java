package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Corps de la requete pour inviter quelqu'un a rejoindre un projet par
 * e-mail (remplace l'ancienne selection d'un utilisateur existant par ID
 * dans une liste deroulante).
 */
@Getter
@Setter
public class InvitationRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit etre valide")
    private String email;

    /**
     * Role/fonction a accorder sur CE projet des acceptation (ex:
     * "CHEF_PROJET", "DEVELOPPEUR", "DESIGNER", "TESTEUR"). Par defaut "MEMBRE".
     */
    private String roleProjet = "MEMBRE";
}
