package com.odc.gestionprojet.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Corps de la requete pour envoyer un e-mail simule.
 */
@Getter
@Setter
public class MailRequest {

    @NotBlank(message = "Le destinataire est obligatoire")
    @Email(message = "Le destinataire doit etre un email valide")
    private String destinataire;

    private String nomMembre;

    private String roleMembre;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 200, message = "Le sujet ne peut pas depasser 200 caracteres")
    private String sujet;

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 4000, message = "Le message ne peut pas depasser 4000 caracteres")
    private String messageTexte;

    private List<String> projetIds;
}
