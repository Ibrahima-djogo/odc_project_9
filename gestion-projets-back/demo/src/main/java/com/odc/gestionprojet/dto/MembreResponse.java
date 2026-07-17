package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Objet retourne au client representant un membre d'un projet
 * (avec ses informations de profil et son role dans le projet).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MembreResponse {

    private Long membreProjetId;

    // Informations sur le projet
    private Long projetId;
    private String projetNom;

    // Informations sur l'utilisateur
    private Long utilisateurId;
    private String utilisateurNom;
    private String utilisateurPrenom;
    private String utilisateurEmail;

    // Informations sur l'appartenance
    private String roleProjet;
    private LocalDateTime dateAjout;
}
