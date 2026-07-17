package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represente un commentaire laisse par un utilisateur sur une tache.
 * Correspond a la table "commentaires" de notre schema.
 */
@Entity
@Table(name = "commentaires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Commentaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le commentaire ne peut pas etre vide")
    @Column(nullable = false, length = 1000)
    private String contenu;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    // ===================================================================
    // RELATIONS
    // ===================================================================

    // Le commentaire est rattache a UNE tache
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tache", nullable = false)
    private Tache tache;

    // Le commentaire a ete ecrit par UN utilisateur
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_auteur", nullable = false)
    private Utilisateur auteur;

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
