package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.MembreRequest;
import com.odc.gestionprojet.dto.MembreResponse;
import com.odc.gestionprojet.entity.MembreProjet;
import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ConflictException;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier pour la gestion des membres d'un projet.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MembreService {

    private final MembreProjetRepository membreProjetRepository;
    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    /**
     * Ajoute un utilisateur comme membre d'un projet.
     * Leve ConflictException si l'utilisateur est deja membre.
     */
    public MembreResponse ajouterMembre(Long projetId, MembreRequest request) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getUtilisateurId(), "utilisateurId must not be null");

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));

        Utilisateur utilisateur = utilisateurRepository.findById(request.getUtilisateurId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", request.getUtilisateurId()));

        // Verification : l'utilisateur n'est pas deja membre de ce projet
        if (membreProjetRepository.existsByProjetIdAndUtilisateurId(projetId, request.getUtilisateurId())) {
            throw new ConflictException("Cet utilisateur est deja membre du projet");
        }

        MembreProjet membre = new MembreProjet();
        membre.setProjet(projet);
        membre.setUtilisateur(utilisateur);
        membre.setRoleProjet(request.getRoleProjet() != null ? request.getRoleProjet() : "MEMBRE");

        MembreProjet sauvegarde = membreProjetRepository.save(membre);

        // Notification par e-mail : asynchrone (EmailService), ne bloque pas
        // la reponse HTTP et n'echoue jamais l'affectation elle-meme si le
        // SMTP est indisponible.
        emailService.envoyerNotificationAffectationProjet(
                utilisateur.getEmail(), utilisateur.getPrenom(),
                projet.getNom(), sauvegarde.getRoleProjet());

        return toResponse(sauvegarde);
    }

    /**
     * Retourne la liste de tous les membres d'un projet.
     */
    @Transactional(readOnly = true)
    public List<MembreResponse> listerMembres(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        if (!projetRepository.existsById(projetId)) {
            throw new ResourceNotFoundException("Projet", projetId);
        }
        return membreProjetRepository.findByProjetId(projetId)
                .stream()
                .map(membre -> toResponse(membre))
                .collect(Collectors.toList());
    }

    /**
     * Retire un membre d'un projet.
     */
    public void retirerMembre(Long projetId, Long utilisateurId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(utilisateurId, "utilisateurId must not be null");

        MembreProjet membre = membreProjetRepository
                .findByProjetIdAndUtilisateurId(projetId, utilisateurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cet utilisateur n'est pas membre du projet avec l'id : " + projetId));

        membreProjetRepository.delete(membre);
    }

    /**
     * Modifie le role/fonction d'un membre dans un projet.
     */
    public MembreResponse modifierRoleMembre(Long projetId, Long utilisateurId, String nouveauRoleProjet) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(utilisateurId, "utilisateurId must not be null");

        MembreProjet membre = membreProjetRepository
                .findByProjetIdAndUtilisateurId(projetId, utilisateurId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cet utilisateur n'est pas membre du projet avec l'id : " + projetId));

        membre.setRoleProjet(nouveauRoleProjet);
        MembreProjet mis_a_jour = membreProjetRepository.save(membre);
        return toResponse(mis_a_jour);
    }

    // =========================================================================
    // METHODE UTILITAIRE DE MAPPING
    // =========================================================================

    private MembreResponse toResponse(MembreProjet membre) {
        Objects.requireNonNull(membre, "membre must not be null");

        MembreResponse response = new MembreResponse();
        response.setMembreProjetId(membre.getId());
        response.setProjetId(membre.getProjet().getId());
        response.setProjetNom(membre.getProjet().getNom());
        response.setUtilisateurId(membre.getUtilisateur().getId());
        response.setUtilisateurNom(membre.getUtilisateur().getNom());
        response.setUtilisateurPrenom(membre.getUtilisateur().getPrenom());
        response.setUtilisateurEmail(membre.getUtilisateur().getEmail());
        response.setRoleProjet(membre.getRoleProjet());
        response.setDateAjout(membre.getDateAjout());
        return response;
    }
}
