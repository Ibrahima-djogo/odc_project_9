package com.odc.gestionprojet.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUtilisateurRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    private String email;

    /**
     * Optionnel : nouveau role global ("ADMIN"/"MEMBRE"/"CHEF_DE_PROJET").
     * Le frontend envoie la cle JSON "role" (pas "roleGlobal").
     * Seul un ADMIN est autorise a modifier ce champ (verifie dans le service).
     */
    @JsonAlias("role")
    private String roleGlobal;
}
