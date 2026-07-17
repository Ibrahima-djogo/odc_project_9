package com.odc.gestionprojet.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Donnees attendues lorsqu'un nouvel utilisateur s'inscrit (ou est cree par
 * un ADMIN). Le frontend envoie le role global sous la cle JSON "role"
 * (pas "roleGlobal") : @JsonAlias permet d'accepter les deux.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prenom est obligatoire")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit etre valide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caracteres")
    private String motDePasse;

    /**
     * Rôle global : "ADMIN", "CHEF_DE_PROJET" ou "MEMBRE". Par défaut "MEMBRE".
     */
    @JsonAlias("role")
    private String roleGlobal = "MEMBRE";
}
