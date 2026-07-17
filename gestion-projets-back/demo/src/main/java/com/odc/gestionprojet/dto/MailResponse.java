package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Representation d'un e-mail simule renvoyee au frontend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MailResponse {
    private Long id;
    private String expediteur;
    private String destinataire;
    private String nomMembre;
    private String roleMembre;
    private String sujet;
    private String messageTexte;
    private LocalDateTime dateEnvoi;
    private List<String> projetIds;
}
