package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Objet retourne au client representant un commentaire avec
 * les informations resumees sur son auteur et la tache concernee.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentaireResponse {

    private Long id;
    private String contenu;
    private LocalDateTime dateCreation;

    // Informations sur la tache concernee
    private Long tacheId;
    private String tacheNom;

    // Informations sur l'auteur du commentaire
    private Long auteurId;
    private String auteurNom;
    private String auteurPrenom;
}
