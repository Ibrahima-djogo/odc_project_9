package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represente un utilisateur de l'application (un membre du groupe / une personne
 * qui peut creer des projets, recevoir des taches, commenter, etc.)
 *
 * Correspond a la table "utilisateurs" de notre schema.
 */
@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor   // constructeur vide, obligatoire pour JPA
@AllArgsConstructor  // constructeur avec tous les champs, pratique pour les tests
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false, length = 100)
    private String nom;

    @NotBlank(message = "Le prenom est obligatoire")
    @Column(nullable = false, length = 100)
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit etre valide")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Ce champ contiendra le mot de passe HACHE (jamais en clair), via BCrypt.
    // On verra ca en detail a l'etape securite.
    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(nullable = false)
    private String motDePasse;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    /**
     * Rôle global de l'utilisateur dans l'application.
     * Valeurs possibles : "ADMIN", "MEMBRE" (uniquement ces deux-là).
     * Distinct du rôle dans membres_projet qui est spécifique à un projet.
     */
    @Column(name = "role_global", nullable = false, length = 30)
    private String roleGlobal = "MEMBRE";

    // ===================================================================
    // RELATIONS
    // ===================================================================

    // Un utilisateur peut creer plusieurs projets.
    // mappedBy = "createur" : signifie que c'est l'entite Projet qui possede
    // la cle etrangere (la colonne id_createur), pas Utilisateur.
    @OneToMany(mappedBy = "createur", cascade = CascadeType.PERSIST)
    private List<Projet> projetsCrees = new ArrayList<>();

    // Un utilisateur peut etre membre de plusieurs projets (via la table de liaison)
    @OneToMany(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MembreProjet> participations = new ArrayList<>();

    // Un utilisateur peut avoir plusieurs taches assignees
    @OneToMany(mappedBy = "assigneA")
    private List<Tache> tachesAssignees = new ArrayList<>();

    // Un utilisateur peut ecrire plusieurs commentaires
    @OneToMany(mappedBy = "auteur", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Commentaire> commentaires = new ArrayList<>();

    // Methode appelee automatiquement par JPA juste avant l'insertion en base.
    // Permet de fixer la date de creation sans avoir a y penser a chaque fois.
    @PrePersist
    protected void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
