package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO dedie uniquement a la mise a jour du statut d'une tache.
 * Separe du TacheRequest complet pour permettre une route PATCH legere :
 * PATCH /api/taches/{id}/statut
 * Corps : { "statut": "EN_COURS" }
 */
@Getter
@Setter
public class TacheStatutRequest {

    @NotBlank(message = "Le statut est obligatoire")
    private String statut;
}
