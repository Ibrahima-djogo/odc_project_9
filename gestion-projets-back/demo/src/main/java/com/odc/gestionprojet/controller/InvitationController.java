package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.InvitationPreviewResponse;
import com.odc.gestionprojet.dto.InvitationRequest;
import com.odc.gestionprojet.dto.InvitationResponse;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.service.InvitationService;
import com.odc.gestionprojet.service.RoleCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour le systeme d'invitation par e-mail (remplace, cote
 * UX chef-de-projet, l'ancien ajout d'un membre par selection dans une
 * liste deroulante).
 *
 * Droits :
 * - POST/GET/DELETE sur /api/projets/{projetId}/invitations : reserve au
 *   CHEF de ce projet (ou ADMIN), comme /api/projets/{id}/membres.
 * - GET /api/invitations/{token} : PUBLIC (aucune authentification), pour
 *   afficher l'apercu avant connexion/inscription.
 * - POST /api/invitations/{token}/accepter : authentifie (n'importe quel
 *   utilisateur connecte ; le controle se fait sur la correspondance
 *   d'e-mail dans InvitationService.accepterInvitation).
 */
@RestController
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;
    private final RoleCheckService roleCheckService;

    /**
     * POST /api/projets/{projetId}/invitations
     * Invite quelqu'un par e-mail a rejoindre ce projet. Reserve au chef de
     * ce projet (ou ADMIN).
     */
    @PostMapping("/api/projets/{projetId}/invitations")
    public ResponseEntity<InvitationResponse> inviter(
            @PathVariable Long projetId,
            @Valid @RequestBody InvitationRequest request) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        Utilisateur inviteur = roleCheckService.getUtilisateurConnecte();
        InvitationResponse response = invitationService.creerOuRenouvelerInvitation(projetId, request, inviteur);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/projets/{projetId}/invitations
     * Liste les invitations EN_ATTENTE de ce projet. Reserve au chef de ce
     * projet (ou ADMIN).
     */
    @GetMapping("/api/projets/{projetId}/invitations")
    public ResponseEntity<List<InvitationResponse>> listerInvitationsEnAttente(@PathVariable Long projetId) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        return ResponseEntity.ok(invitationService.listerInvitationsEnAttente(projetId));
    }

    /**
     * DELETE /api/projets/{projetId}/invitations/{invitationId}
     * Revoque une invitation en attente. Reserve au chef de ce projet (ou ADMIN).
     */
    @DeleteMapping("/api/projets/{projetId}/invitations/{invitationId}")
    public ResponseEntity<Void> revoquer(@PathVariable Long projetId, @PathVariable Long invitationId) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        invitationService.revoquerInvitation(projetId, invitationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/invitations/{token}
     * Apercu PUBLIC d'une invitation (avant connexion/inscription). Ne leve
     * jamais d'erreur : le corps indique valide=false + un motif si le
     * token ne mene a rien d'utilisable.
     */
    @GetMapping("/api/invitations/{token}")
    public ResponseEntity<InvitationPreviewResponse> apercu(@PathVariable String token) {
        return ResponseEntity.ok(invitationService.obtenirApercu(token));
    }

    /**
     * POST /api/invitations/{token}/accepter
     * Accepte l'invitation pour l'utilisateur connecte (le compte peut
     * venir d'etre cree, ou deja exister). L'e-mail du compte connecte doit
     * correspondre a celui de l'invitation, sinon 403. Renvoie l'ID du
     * projet rejoint, pour que le frontend puisse y naviguer directement.
     */
    @PostMapping("/api/invitations/{token}/accepter")
    public ResponseEntity<java.util.Map<String, Long>> accepter(@PathVariable String token) {
        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();
        Long projetId = invitationService.accepterInvitation(token, connecte);
        return ResponseEntity.ok(java.util.Map.of("projetId", projetId));
    }
}
