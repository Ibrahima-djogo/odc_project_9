package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.MailRequest;
import com.odc.gestionprojet.dto.MailResponse;
import com.odc.gestionprojet.service.MailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la "boite mail" simulee (notifications d'invitation et
 * messages libres entre collaborateurs). Necessite un token JWT valide.
 *
 * Base URL : /api/mails
 */
@RestController
@RequestMapping("/api/mails")
@RequiredArgsConstructor
public class MailController {

    private final MailService mailService;

    /**
     * GET /api/mails
     * Retourne les mails ou l'utilisateur connecte est expediteur ou destinataire.
     */
    @GetMapping
    public ResponseEntity<List<MailResponse>> listerMails() {
        return ResponseEntity.ok(mailService.listerMailsUtilisateurConnecte());
    }

    /**
     * POST /api/mails
     * Enregistre un nouveau mail envoye par l'utilisateur connecte.
     */
    @PostMapping
    public ResponseEntity<MailResponse> envoyerMail(@Valid @RequestBody MailRequest request) {
        MailResponse response = mailService.envoyerMail(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * DELETE /api/mails/{id}
     * Supprime un mail (reserve a l'ADMIN ou aux deux participants du mail).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMail(@PathVariable Long id) {
        mailService.supprimerMail(id);
        return ResponseEntity.noContent().build();
    }
}
