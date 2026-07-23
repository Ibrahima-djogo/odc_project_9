package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represente un projet collaboratif (le "conteneur" des taches).
 * Correspond a la table "projets" de notre schema.
 */
@Entity
@Table(name = "projets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 1000)
    private String description;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    // Statut du projet : PLANIFIE, EN_COURS ou TERMINE. Entierement calcule a
    // partir des taches du projet (voir TacheService.recalculerStatutProjet) :
    // PLANIFIE tant qu'aucune tache n'a demarre, EN_COURS des qu'au moins une
    // tache est EN_COURS, TERMINE quand TOUTES les taches sont TERMINE. Ce
    // champ n'est jamais modifiable manuellement (ni a la creation au-dela du
    // defaut, ni via une mise a jour de projet).
    @Column(nullable = false, length = 30)
    private String statut = "PLANIFIE";

    // Priorite : BASSE, NORMALE, HAUTE, URGENTE
    @Column(length = 20)
    private String priorite = "NORMALE";

    @Column(precision = 12, scale = 2)
    private BigDecimal budget;

    // ===================================================================
    // RELATIONS
    // ===================================================================

    // Chaque projet a ete cree par UN utilisateur (relation N projets -> 1 utilisateur)
    // @JoinColumn definit le nom de la colonne FK en base : id_createur
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_createur", nullable = false)
    private Utilisateur createur;

    // Un projet contient plusieurs taches
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Tache> taches = new ArrayList<>();

    // Un projet a plusieurs membres (via la table de liaison membres_projet)
    @OneToMany(mappedBy = "projet", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MembreProjet> membres = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
