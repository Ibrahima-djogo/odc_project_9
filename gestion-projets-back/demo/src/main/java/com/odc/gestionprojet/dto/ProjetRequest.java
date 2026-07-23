package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Objet recu du client lors de la creation ou modification d'un projet.
 * On valide les champs ici pour renvoyer un 400 propre si quelque chose manque.
 */
@Getter
@Setter
public class ProjetRequest {

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Size(max = 150, message = "Le nom ne peut pas depasser 150 caracteres")
    private String nom;

    @Size(max = 1000, message = "La description ne peut pas depasser 1000 caracteres")
    private String description;

    private LocalDate dateFin;

    // Pas de champ "statut" ici : il est entierement calcule par le backend
    // a partir des taches du projet (voir TacheService.recalculerStatutProjet),
    // jamais fourni ni modifiable par le client.

    /**
     * Valeurs acceptees : BASSE, NORMALE, HAUTE, URGENTE
     */
    private String priorite = "NORMALE";

    private BigDecimal budget;

    private Long chefDeProjetId;
    private List<Long> membreIdsAffectes;

    // Getters and setters are provided by Lombok

}
