package com.odc.gestionprojet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO pour représenter les informations publiques de base d'un utilisateur.
 * Utile pour lister tous les utilisateurs dans le frontend sans exposer les mots de passe.
 *
 * Serialise roleGlobal sous la cle JSON "role" : c'est la cle que le
 * frontend (api.js) lit (data.role), pas "roleGlobal".
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;

    @JsonProperty("role")
    private String roleGlobal;
}
