package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represente une tache au sein d'un projet.
 * Correspond a la table "taches" de notre schema.
 */
@Entity
@Table(name = "taches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom de la tache est obligatoire")
    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 1000)
    private String description;

    // Statut demande par la fiche : "a faire", "en cours", "termine"
    // On utilise des constantes en majuscules sans accent (convention courante
    // en base de donnees) : A_FAIRE, EN_COURS, TERMINE
    @Column(nullable = false, length = 20)
    private String statut = "A_FAIRE";

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    // ===================================================================
    // RELATIONS
    // ===================================================================

    // La tache appartient a UN projet (colonne id_projet en base)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_projet", nullable = false)
    private Projet projet;

    // La tache est assignee a UN utilisateur (peut etre null si pas encore assignee)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_assigne")
    private Utilisateur assigneA;

    // Une tache peut recevoir plusieurs commentaires
    @OneToMany(mappedBy = "tache", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Commentaire> commentaires = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
