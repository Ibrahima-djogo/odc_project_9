package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Objet retourne au client representant une tache avec
 * les informations resumees sur le projet et l'utilisateur assigne.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TacheResponse {

    private Long id;
    private String nom;
    private String description;
    private String statut;
    private LocalDate dateLimite;
    private LocalDateTime dateCreation;

    // Informations sur le projet parent
    private Long projetId;
    private String projetNom;

    // Informations sur l'utilisateur assigne (peut etre null)
    private Long assigneAId;
    private String assigneANom;
    private String assigneAPrenom;

    // Nombre de commentaires sur cette tache (utile pour le frontend)
    private int nombreCommentaires;

    // true si l'utilisateur connecte peut modifier cette tache / son statut :
    // ADMIN, chef du projet, ou membre assigne a cette tache precise.
    private boolean peutModifier;
}
