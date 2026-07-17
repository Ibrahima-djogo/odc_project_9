package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Corps de la requete pour creer ou modifier une tache.
 */
@Getter
@Setter
public class TacheRequest {

    @NotBlank(message = "Le nom de la tache est obligatoire")
    @Size(max = 150, message = "Le nom ne peut pas depasser 150 caracteres")
    private String nom;

    @Size(max = 1000, message = "La description ne peut pas depasser 1000 caracteres")
    private String description;

    private LocalDate dateLimite;

    /**
     * Valeurs acceptees : A_FAIRE, EN_COURS, TERMINE
     */
    private String statut = "A_FAIRE";

    /**
     * Identifiant du projet auquel appartient cette tache.
     * Obligatoire a la creation.
     */
    @NotNull(message = "L'identifiant du projet est obligatoire")
    private Long projetId;

    /**
     * Identifiant de l'utilisateur a qui la tache est assignee.
     * Peut etre null si la tache n'est pas encore assignee.
     */
    private Long assigneAId;
}
