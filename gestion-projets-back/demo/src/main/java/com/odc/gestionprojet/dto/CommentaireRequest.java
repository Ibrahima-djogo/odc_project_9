package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Corps de la requete pour creer un commentaire sur une tache.
 */
@Getter
@Setter
public class CommentaireRequest {

    @NotBlank(message = "Le commentaire ne peut pas etre vide")
    @Size(max = 1000, message = "Le commentaire ne peut pas depasser 1000 caracteres")
    private String contenu;
}
