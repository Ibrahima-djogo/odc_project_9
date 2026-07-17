package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.CommentaireRequest;
import com.odc.gestionprojet.dto.CommentaireResponse;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.service.CommentaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des commentaires sur les taches.
 * Tous ces endpoints necessitent un token JWT valide.
 *
 * Base URL : /api/taches/{tacheId}/commentaires
 */
@RestController
@RequestMapping("/api/taches/{tacheId}/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireService commentaireService;
    private final UtilisateurRepository utilisateurRepository;

    /**
     * POST /api/taches/{tacheId}/commentaires
     * Ajoute un commentaire sur une tache.
     * L'auteur est l'utilisateur connecte.
     */
    @PostMapping
    public ResponseEntity<CommentaireResponse> ajouterCommentaire(
            @PathVariable Long tacheId,
            @Valid @RequestBody CommentaireRequest request) {
        Long auteurId = getUtilisateurConnecteId();
        CommentaireResponse response = commentaireService.ajouterCommentaire(tacheId, request, auteurId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/taches/{tacheId}/commentaires
     * Retourne tous les commentaires d'une tache, tries du plus ancien au plus recent.
     */
    @GetMapping
    public ResponseEntity<List<CommentaireResponse>> listerCommentaires(@PathVariable Long tacheId) {
        List<CommentaireResponse> commentaires = commentaireService.listerCommentairesTache(tacheId);
        return ResponseEntity.ok(commentaires);
    }

    /**
     * PUT /api/taches/{tacheId}/commentaires/{commentaireId}
     * Modifie le contenu d'un commentaire.
     */
    @PutMapping("/{commentaireId}")
    public ResponseEntity<CommentaireResponse> modifierCommentaire(
            @PathVariable Long tacheId,
            @PathVariable Long commentaireId,
            @Valid @RequestBody CommentaireRequest request) {
        CommentaireResponse response = commentaireService.modifierCommentaire(commentaireId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/taches/{tacheId}/commentaires/{commentaireId}
     * Supprime un commentaire.
     */
    @DeleteMapping("/{commentaireId}")
    public ResponseEntity<Void> supprimerCommentaire(
            @PathVariable Long tacheId,
            @PathVariable Long commentaireId) {
        commentaireService.supprimerCommentaire(commentaireId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // METHODE UTILITAIRE
    // =========================================================================

    private Long getUtilisateurConnecteId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur connecte introuvable avec l'email : " + email));
        return utilisateur.getId();
    }
}
