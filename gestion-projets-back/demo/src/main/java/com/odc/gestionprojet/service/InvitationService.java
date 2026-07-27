package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.InvitationPreviewResponse;
import com.odc.gestionprojet.dto.InvitationRequest;
import com.odc.gestionprojet.dto.InvitationResponse;
import com.odc.gestionprojet.entity.Invitation;
import com.odc.gestionprojet.entity.MembreProjet;
import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ConflictException;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.InvitationRepository;
import com.odc.gestionprojet.repository.MailRepository;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.entity.Mail;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier des invitations par e-mail : creation/renouvellement,
 * liste, revocation, apercu public et acceptation securisee.
 *
 * Une Invitation ne cree AUCUNE ligne MembreProjet tant qu'elle n'est pas
 * acceptee : c'est une entite temporaire et separee, pas une variante "en
 * attente" de MembreProjet (voir Invitation.java).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class InvitationService {

    private static final int DUREE_VALIDITE_JOURS = 7;
    private static final String STATUT_EN_ATTENTE = "EN_ATTENTE";
    private static final String STATUT_ACCEPTEE = "ACCEPTEE";
    private static final String STATUT_REVOQUEE = "REVOQUEE";

    private final InvitationRepository invitationRepository;
    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final EmailService emailService;
    private final MailRepository mailRepository;

    @Value("${app.mail.frontend-url:http://localhost:5173}")
    private String urlFrontend;

    /**
     * Cree une invitation, ou renouvelle (nouveau token, expiration reculee)
     * celle deja EN_ATTENTE pour ce couple projet/e-mail — evite les
     * doublons quand le chef clique deux fois "inviter" sur la meme adresse.
     */
    public InvitationResponse creerOuRenouvelerInvitation(Long projetId, InvitationRequest request, Utilisateur inviteur) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(inviteur, "inviteur must not be null");

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));

        String emailNormalise = request.getEmail().trim().toLowerCase();

        utilisateurRepository.findByEmail(emailNormalise).ifPresent(u -> {
            if (membreProjetRepository.existsByProjetIdAndUtilisateurId(projetId, u.getId())) {
                throw new ConflictException("Cette personne est deja membre du projet");
            }
        });

        Invitation invitation = invitationRepository
                .findByProjetIdAndEmailIgnoreCaseAndStatut(projetId, emailNormalise, STATUT_EN_ATTENTE)
                .orElseGet(Invitation::new);

        String tokenClair = genererToken();
        invitation.setProjet(projet);
        invitation.setEmail(emailNormalise);
        invitation.setRoleProjet(request.getRoleProjet() != null && !request.getRoleProjet().isBlank()
                ? request.getRoleProjet() : "MEMBRE");
        invitation.setTokenHash(hasher(tokenClair));
        invitation.setStatut(STATUT_EN_ATTENTE);
        invitation.setInvitePar(inviteur);
        invitation.setDateExpiration(LocalDateTime.now().plusDays(DUREE_VALIDITE_JOURS));
        invitation.setDateAcceptation(null);

        Invitation sauvegardee = invitationRepository.save(invitation);
        String lien = urlFrontend + "/?invite=" + tokenClair;

        emailService.envoyerInvitationProjet(
                emailNormalise, projet.getNom(), invitation.getRoleProjet(),
                inviteur.getPrenom() + " " + inviteur.getNom(), tokenClair);

        try {
            Mail internalMail = new Mail();
            internalMail.setExpediteur(inviteur.getEmail());
            internalMail.setDestinataire(emailNormalise);
            internalMail.setNomMembre(inviteur.getPrenom() + " " + inviteur.getNom());
            internalMail.setRoleMembre(invitation.getRoleProjet());
            internalMail.setSujet(inviteur.getPrenom() + " vous invite à rejoindre \"" + projet.getNom() + "\"");
            internalMail.setMessageTexte("Bonjour, vous avez été invité(e) au projet \"" + projet.getNom() + "\". Cliquez ici pour rejoindre : " + lien);
            internalMail.setProjetIdsCsv(projet.getId().toString());
            mailRepository.save(internalMail);
        } catch (Exception e) {
            // Ignorer si la messagerie interne échoue
        }

        InvitationResponse response = toResponse(sauvegardee);
        response.setLienInvitation(lien);
        return response;
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listerInvitationsEnAttente(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        return invitationRepository.findByProjetIdAndStatutOrderByDateCreationDesc(projetId, STATUT_EN_ATTENTE)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void revoquerInvitation(Long projetId, Long invitationId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(invitationId, "invitationId must not be null");

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", invitationId));

        if (!invitation.getProjet().getId().equals(projetId)) {
            // Ne pas confirmer/infirmer l'existence d'une invitation d'un
            // AUTRE projet : 404 plutot que 403, comme si elle n'existait pas ici.
            throw new ResourceNotFoundException("Invitation", invitationId);
        }

        invitation.setStatut(STATUT_REVOQUEE);
        invitationRepository.save(invitation);
    }

    /**
     * Apercu PUBLIC (pas d'authentification) : ne leve jamais d'exception,
     * renvoie toujours 200 avec valide=false et un motif si le token est
     * introuvable/expire/revoque/deja accepte.
     */
    @Transactional(readOnly = true)
    public InvitationPreviewResponse obtenirApercu(String token) {
        Objects.requireNonNull(token, "token must not be null");

        InvitationPreviewResponse apercu = new InvitationPreviewResponse();

        Invitation invitation = invitationRepository.findByTokenHash(hasher(token)).orElse(null);
        if (invitation == null) {
            apercu.setValide(false);
            apercu.setMotifInvalide("Invitation introuvable.");
            return apercu;
        }
        if (STATUT_REVOQUEE.equals(invitation.getStatut())) {
            apercu.setValide(false);
            apercu.setMotifInvalide("Cette invitation a ete revoquee.");
            return apercu;
        }
        if (STATUT_ACCEPTEE.equals(invitation.getStatut())) {
            apercu.setValide(false);
            apercu.setMotifInvalide("Cette invitation a deja ete acceptee.");
            return apercu;
        }
        if (invitation.getDateExpiration().isBefore(LocalDateTime.now())) {
            apercu.setValide(false);
            apercu.setMotifInvalide("Cette invitation a expire.");
            return apercu;
        }

        apercu.setValide(true);
        apercu.setProjetNom(invitation.getProjet().getNom());
        apercu.setEmail(invitation.getEmail());
        apercu.setRoleProjet(invitation.getRoleProjet());
        apercu.setInviteParNom(invitation.getInvitePar().getPrenom() + " " + invitation.getInvitePar().getNom());
        return apercu;
    }

    /**
     * Accepte une invitation pour l'utilisateur CONNECTE. Controle de
     * securite central : l'e-mail de l'invitation doit correspondre a celui
     * du compte connecte, sinon 403 explicite (empeche qu'un lien
     * transfere/intercepte soit accepte par n'importe qui).
     */
    public Long accepterInvitation(String token, Utilisateur connecte) {
        Objects.requireNonNull(token, "token must not be null");
        Objects.requireNonNull(connecte, "connecte must not be null");

        Invitation invitation = invitationRepository.findByTokenHash(hasher(token))
                .orElseThrow(() -> new ResourceNotFoundException("Invitation", 0L));

        if (STATUT_REVOQUEE.equals(invitation.getStatut())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Cette invitation a ete revoquee.");
        }
        if (invitation.getDateExpiration().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Cette invitation a expire.");
        }
        if (!invitation.getEmail().trim().equalsIgnoreCase(connecte.getEmail().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cette invitation a ete envoyee a une autre adresse e-mail. "
                            + "Connectez-vous avec l'adresse invitee (" + invitation.getEmail() + ").");
        }

        Long projetId = invitation.getProjet().getId();

        if (!membreProjetRepository.existsByProjetIdAndUtilisateurId(projetId, connecte.getId())) {
            MembreProjet membre = new MembreProjet();
            membre.setProjet(invitation.getProjet());
            membre.setUtilisateur(connecte);
            membre.setRoleProjet(invitation.getRoleProjet() != null ? invitation.getRoleProjet() : "MEMBRE");
            membreProjetRepository.save(membre);
        }

        if (!STATUT_ACCEPTEE.equals(invitation.getStatut())) {
            invitation.setStatut(STATUT_ACCEPTEE);
            invitation.setDateAcceptation(LocalDateTime.now());
            invitationRepository.save(invitation);
        }

        return projetId;
    }

    // =========================================================================
    // METHODES UTILITAIRES
    // =========================================================================

    private String genererToken() {
        byte[] octets = new byte[32];
        new SecureRandom().nextBytes(octets);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    private String hasher(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexadecimal = new StringBuilder();
            for (byte b : hash) {
                hexadecimal.append(String.format("%02x", b));
            }
            return hexadecimal.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible sur cette JVM", e);
        }
    }

    private InvitationResponse toResponse(Invitation invitation) {
        InvitationResponse response = new InvitationResponse();
        response.setId(invitation.getId());
        response.setProjetId(invitation.getProjet().getId());
        response.setProjetNom(invitation.getProjet().getNom());
        response.setEmail(invitation.getEmail());
        response.setRoleProjet(invitation.getRoleProjet());
        response.setStatut(invitation.getStatut());
        response.setInviteParNom(invitation.getInvitePar().getPrenom() + " " + invitation.getInvitePar().getNom());
        response.setDateCreation(invitation.getDateCreation());
        response.setDateExpiration(invitation.getDateExpiration());
        return response;
    }
}
