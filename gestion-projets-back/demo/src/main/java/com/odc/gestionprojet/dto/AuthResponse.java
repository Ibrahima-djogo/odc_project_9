package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ce qu'on renvoie au client apres une inscription ou un login reussi.
 * Contient le token JWT que le client devra renvoyer dans les requetes
 * suivantes, plus quelques infos utiles pour l'affichage immediat
 * (pas besoin de refaire une requete juste pour afficher le nom).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String roleGlobal;
}
