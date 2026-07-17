package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represente un e-mail "simule" echange entre utilisateurs de l'application
 * (notification d'invitation/bienvenue, ou message libre entre collaborateurs).
 * Correspond a la table "mails".
 */
@Entity
@Table(name = "mails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Mail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "L'expediteur est obligatoire")
    @Column(nullable = false, length = 150)
    private String expediteur;

    @NotBlank(message = "Le destinataire est obligatoire")
    @Column(nullable = false, length = 150)
    private String destinataire;

    @Column(name = "nom_membre", length = 150)
    private String nomMembre;

    @Column(name = "role_membre", length = 30)
    private String roleMembre;

    @NotBlank(message = "Le sujet est obligatoire")
    @Column(nullable = false, length = 200)
    private String sujet;

    @NotBlank(message = "Le message est obligatoire")
    @Column(name = "message_texte", nullable = false, length = 4000)
    private String messageTexte;

    @Column(name = "date_envoi", nullable = false, updatable = false)
    private LocalDateTime dateEnvoi;

    // Identifiants de projets associes (ex: invitation liee a des projets),
    // stockes en une seule colonne "1,2,3" : ils ne sont jamais interroges
    // cote SQL, seulement restitues tels quels au frontend.
    @Column(name = "projet_ids", length = 500)
    private String projetIdsCsv;

    @PrePersist
    protected void onCreate() {
        this.dateEnvoi = LocalDateTime.now();
    }
}
