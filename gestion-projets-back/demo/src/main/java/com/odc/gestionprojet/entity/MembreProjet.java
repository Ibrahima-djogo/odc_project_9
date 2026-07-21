package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Table de liaison entre Utilisateur et Projet.
 *
 * Pourquoi cette table existe : un projet a PLUSIEURS membres, et un
 * utilisateur peut participer a PLUSIEURS projets. C'est une relation
 * "plusieurs a plusieurs" (N-N). On ne peut pas la representer avec une
 * simple cle etrangere dans Utilisateur ou dans Projet : il faut une
 * table intermediaire qui stocke chaque "association" + des infos en plus
 * (ici : le role du membre dans CE projet precis, et la date a laquelle
 * il a ete ajoute).
 *
 * Correspond a la table "membres_projet" de notre schema.
 */
@Entity
@Table(name = "membres_projet",
        // Empeche d'ajouter deux fois le meme utilisateur sur le meme projet
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_projet", "id_utilisateur"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MembreProjet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_projet", nullable = false)
    private Projet projet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    // Role/fonction du membre DANS CE PROJET (ex: "CHEF_PROJET", "DEVELOPPEUR",
    // "DESIGNER", "TESTEUR"). Une meme personne peut etre chef sur un projet et
    // simple developpeur sur un autre, d'ou le fait que ce champ soit ici et
    // non dans Utilisateur (qui ne porte que le roleGlobal ADMIN/MEMBRE, pour
    // la securite applicative globale).
    @Column(name = "role_projet", nullable = false, length = 50)
    private String roleProjet = "MEMBRE";

    // Colonne héritée 'role' dans la table membres_projet (NOT NULL, pas de défaut).
    // On la remplit automatiquement avec la même valeur que roleProjet.
    @Column(name = "role", nullable = false, length = 50)
    private String role = "MEMBRE";

    @Column(name = "date_ajout", nullable = false, updatable = false)
    private LocalDateTime dateAjout;

    @PrePersist
    protected void onCreate() {
        this.dateAjout = LocalDateTime.now();
        // Synchroniser la colonne héritée 'role' avec roleProjet
        if (this.roleProjet != null) {
            this.role = this.roleProjet;
        }
    }
}
