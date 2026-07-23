package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.RegisterRequest;
import com.odc.gestionprojet.dto.UpdateUtilisateurRequest;
import com.odc.gestionprojet.dto.UtilisateurResponse;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ConflictException;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Service transactionnel pour la gestion des utilisateurs.
 * Toute mutation de l'entite Utilisateur passe par ce service afin de
 * garantir qu'elle s'execute dans une transaction unique et est bien flushee.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UtilisateurService {

    private static final java.util.Set<String> ROLES_GLOBAUX_AUTORISES = java.util.Set.of("ADMIN", "MEMBRE");

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleCheckService roleCheckService;

    /**
     * Retourne la liste des utilisateurs visibles par l'utilisateur connecte.
     * - ADMIN : voit tous les utilisateurs de la plateforme.
     * - MEMBRE : ne voit que lui-meme et les collaborateurs
     *   avec qui il partage au moins un projet (confidentialite : on ne
     *   doit pas pouvoir lister tous les comptes de la plateforme).
     */
    @Transactional(readOnly = true)
    public List<UtilisateurResponse> listerUtilisateursVisibles() {
        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();

        List<Utilisateur> utilisateurs;
        if (roleCheckService.estAdmin(connecte)) {
            utilisateurs = utilisateurRepository.findAll();
        } else {
            utilisateurs = new ArrayList<>();
            // Se voir soi-meme est necessaire (affichage de son propre avatar,
            // de ses commentaires, de ses taches assignees...), meme sans
            // aucun projet partage.
            utilisateurs.add(connecte);
            utilisateurs.addAll(utilisateurRepository.findCollaborateursPartageantUnProjet(connecte.getId()));
        }

        return utilisateurs.stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Cree un nouvel utilisateur a l'initiative d'un ADMIN (interface d'administration).
     * Contrairement a AuthService.register (inscription publique), cette methode ne
     * genere pas de token JWT : l'admin cree un compte pour quelqu'un d'autre, pas pour
     * lui-meme. Le controle d'acces (reserve a l'ADMIN) est fait en amont, dans le
     * controller, avant l'appel a cette methode.
     *
     * Le roleGlobal envoye par le client est TOUJOURS ignore : un compte est
     * systematiquement cree MEMBRE, quel que soit le contenu de la requete
     * (meme si l'appelant est deja ADMIN). La promotion ADMIN se fait apres
     * coup, explicitement, via mettreAJourUtilisateur.
     */
    public UtilisateurResponse creerUtilisateur(RegisterRequest request) {
        Objects.requireNonNull(request, "request must not be null");

        String emailNormalise = request.getEmail().trim().toLowerCase();
        if (utilisateurRepository.existsByEmail(emailNormalise)) {
            throw new ConflictException("Un compte existe déjà avec cet email");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom().trim());
        utilisateur.setPrenom(request.getPrenom().trim());
        utilisateur.setEmail(emailNormalise);
        // Mot de passe hache exactement comme lors de l'inscription publique
        // (AuthService.register) : jamais stocke en clair.
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setRoleGlobal("MEMBRE");

        Utilisateur sauvegarde = utilisateurRepository.saveAndFlush(utilisateur);
        return toResponse(sauvegarde);
    }

    public UtilisateurResponse mettreAJourUtilisateur(Long id, UpdateUtilisateurRequest request) {
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(request, "request must not be null");

        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));

        String emailNormalise = request.getEmail().trim().toLowerCase();
        utilisateurRepository.findByEmail(emailNormalise)
                .ifPresent(existingUser -> {
                    if (!existingUser.getId().equals(id)) {
                        throw new ConflictException("Un compte existe déjà avec cet email");
                    }
                });

        utilisateur.setNom(request.getNom().trim());
        utilisateur.setPrenom(request.getPrenom().trim());
        utilisateur.setEmail(emailNormalise);

        // Le role global ne peut etre modifie que par un ADMIN (jamais par
        // l'utilisateur lui-meme via son propre "modifier profil"), pour
        // eviter qu'un simple membre s'auto-promeuve ADMIN via cet endpoint.
        if (request.getRoleGlobal() != null && !request.getRoleGlobal().isBlank()) {
            if (!roleCheckService.estAdminConnecte()) {
                throw new AccessDeniedException(
                        "Seul un administrateur peut modifier le role global d'un utilisateur.");
            }
            String roleDemande = request.getRoleGlobal().trim().toUpperCase();
            if (!ROLES_GLOBAUX_AUTORISES.contains(roleDemande)) {
                throw new IllegalArgumentException(
                        "roleGlobal invalide : " + request.getRoleGlobal() +
                                ". Valeurs acceptees : " + ROLES_GLOBAUX_AUTORISES);
            }
            utilisateur.setRoleGlobal(roleDemande);
        }

        // saveAndFlush force l'ecriture immediate en base (au lieu d'attendre
        // la fin de la transaction), afin de detecter tout de suite une
        // eventuelle violation de contrainte plutot qu'au commit.
        Utilisateur utilisateurMisAJour = utilisateurRepository.saveAndFlush(utilisateur);

        return toResponse(utilisateurMisAJour);
    }

    private UtilisateurResponse toResponse(Utilisateur u) {
        return new UtilisateurResponse(u.getId(), u.getNom(), u.getPrenom(), u.getEmail(), u.getRoleGlobal());
    }
}
