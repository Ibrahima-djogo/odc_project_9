package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Corps de la requete pour ajouter un membre a un projet.
 * On recoit l'id de l'utilisateur a ajouter et son role/fonction dans ce projet.
 */
@Getter
@Setter
public class MembreRequest {

    @NotNull(message = "L'identifiant de l'utilisateur est obligatoire")
    private Long utilisateurId;

    /**
     * Role/fonction sur CE projet (ex: "CHEF_PROJET", "DEVELOPPEUR",
     * "DESIGNER", "TESTEUR"). Par defaut : "MEMBRE".
     */
    private String roleProjet = "MEMBRE";
}
