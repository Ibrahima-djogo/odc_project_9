package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Objet envoye au client en reponse aux requetes sur les projets.
 * On n'expose que les champs utiles (pas le mot de passe du createur, etc.)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjetResponse {

    private Long id;
    private String nom;
    private String description;
    private LocalDateTime dateCreation;
    private LocalDate dateFin;
    private String statut;
    private String priorite;
    private BigDecimal budget;

    // Informations resumees sur le createur (pas tout l'objet Utilisateur)
    private Long createurId;
    private String createurNom;
    private String createurPrenom;

    // Rôle contextuel de l'utilisateur connecté sur ce projet
    private String currentUserRole;

    // Indique si l'utilisateur connecté a les droits de gestion sur ce projet :
    // true si ADMIN global OU CHEF_PROJET sur ce projet spécifiquement
    private boolean userHasManagerRights;

    // Statistiques rapides utiles pour le frontend
    private int nombreTaches;
    private int nombreMembres;
}
