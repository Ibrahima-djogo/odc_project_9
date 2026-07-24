package com.odc.gestionprojet.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Invitation d'un utilisateur (identifie par son e-mail, pas forcement deja
 * inscrit sur la plateforme) a rejoindre un projet precis, avec un role
 * projet donne. Ne cree AUCUNE ligne MembreProjet tant qu'elle n'est pas
 * acceptee (voir InvitationService.accepterInvitation) : c'est une entite
 * separee et temporaire, pas une variante "en attente" de MembreProjet.
 *
 * Le token n'est jamais stocke en clair (voir tokenHash) : seul un hash
 * SHA-256 est persiste, pour qu'une fuite de cette table n'expose aucun
 * lien d'invitation valide.
 */
@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_projet", nullable = false)
    private Projet projet;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String email;

    // Role a accorder dans membres_projet lors de l'acceptation (ex:
    // "CHEF_PROJET", "MEMBRE", "DEVELOPPEUR"...).
    @Column(name = "role_projet", nullable = false, length = 50)
    private String roleProjet;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    // EN_ATTENTE, ACCEPTEE, REVOQUEE
    @Column(nullable = false, length = 20)
    private String statut = "EN_ATTENTE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_invite_par", nullable = false)
    private Utilisateur invitePar;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_expiration", nullable = false)
    private LocalDateTime dateExpiration;

    @Column(name = "date_acceptation")
    private LocalDateTime dateAcceptation;

    @PrePersist
    protected void onCreate() {
        if (this.dateCreation == null) {
            this.dateCreation = LocalDateTime.now();
        }
    }
}
