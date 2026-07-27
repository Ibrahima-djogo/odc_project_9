package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.TacheRequest;
import com.odc.gestionprojet.dto.TacheResponse;
import com.odc.gestionprojet.dto.TacheStatutRequest;
import com.odc.gestionprojet.service.RoleCheckService;
import com.odc.gestionprojet.service.TacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Endpoints REST pour la gestion des taches.
 * Tous ces endpoints necessitent un token JWT valide.
 *
 * Droits :
 * - GET : tout utilisateur authentifié
 * - POST/PUT/PATCH/DELETE : CHEF_PROJET sur le projet de la tâche (rôle par-projet, ou ADMIN)
 *
 * Base URL : /api/taches
 */
@RestController
@RequestMapping("/api/taches")
@RequiredArgsConstructor
public class TacheController {

    private final TacheService tacheService;
    private final RoleCheckService roleCheckService;

    /**
     * POST /api/taches
     * Crée une nouvelle tâche. Ouvert aux membres (invités ou créateur) du projet concerné.
     */
    @PostMapping
    public ResponseEntity<TacheResponse> creerTache(@Valid @RequestBody TacheRequest request) {
        // Vérifier que l'appelant est membre ou chef sur le projet de la tâche
        roleCheckService.exigerMembreOuChefDeProjet(request.getProjetId());
        TacheResponse response = tacheService.creerTache(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/taches/projet/{projetId}
     * Retourne toutes les taches d'un projet (accessible à tous).
     */
    @GetMapping("/projet/{projetId}")
    public ResponseEntity<List<TacheResponse>> listerTachesProjet(
            @PathVariable Long projetId,
            @RequestParam(required = false) String statut) {
        List<TacheResponse> taches;
        if (statut != null && !statut.isBlank()) {
            taches = tacheService.listerTachesParStatut(projetId, statut);
        } else {
            taches = tacheService.listerTachesProjet(projetId);
        }
        return ResponseEntity.ok(taches);
    }

    /**
     * GET /api/taches/utilisateur/{utilisateurId}
     * Retourne toutes les taches assignees a un utilisateur.
     */
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<TacheResponse>> listerTachesUtilisateur(
            @PathVariable Long utilisateurId) {
        List<TacheResponse> taches = tacheService.listerTachesUtilisateur(utilisateurId);
        return ResponseEntity.ok(taches);
    }

    /**
     * GET /api/taches/{id}
     * Retourne une tache par son identifiant.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TacheResponse> obtenirTache(@PathVariable Long id) {
        TacheResponse response = tacheService.obtenirTache(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/taches/{id}
     * Met a jour les details generaux d'une tâche (titre, description,
     * echeance, assignation...). Autorisé aux membres et chefs du projet.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TacheResponse> modifierTache(
            @PathVariable Long id,
            @Valid @RequestBody TacheRequest request) {
        TacheResponse tacheExistante = tacheService.obtenirTache(id);
        roleCheckService.exigerMembreOuChefDeProjet(tacheExistante.getProjetId());

        TacheResponse response = tacheService.modifierTache(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/taches/{id}/statut
     * Met a jour uniquement le statut d'une tâche.
     * Modèle "Trello" : autorisé pour le chef du projet (ou ADMIN), OU
     * n'importe quel membre du projet (pas seulement l'assigné de cette
     * tâche précise) — seule la création/édition des détails/suppression
     * reste réservée au chef.
     * Corps : { "statut": "EN_COURS" }
     */
    @PatchMapping("/{id}/statut")
    public ResponseEntity<TacheResponse> changerStatut(
            @PathVariable Long id,
            @Valid @RequestBody TacheStatutRequest request) {
        // Récupérer la tâche pour connaître son projet et son assigné
        TacheResponse tache = tacheService.obtenirTache(id);

        Long utilisateurConnecteId = roleCheckService.getUtilisateurConnecte().getId();
        boolean estAssigne = utilisateurConnecteId.equals(tache.getAssigneAId());
        boolean estChefOuAdmin = roleCheckService.estChefOuAdminSurProjet(tache.getProjetId());
        boolean estMembreDuProjet = roleCheckService.estMembreDuProjet(tache.getProjetId(), utilisateurConnecteId);

        if (!estAssigne && !estChefOuAdmin && !estMembreDuProjet) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous devez être membre de ce projet pour modifier le statut de ses tâches.");
        }

        TacheResponse response = tacheService.changerStatut(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/taches/{id}
     * Supprime une tâche. Réservé au chef du projet.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerTache(@PathVariable Long id) {
        // Récupérer la tâche pour connaître son projet
        TacheResponse tache = tacheService.obtenirTache(id);
        roleCheckService.exigerChefDeProjetSurProjet(tache.getProjetId());
        tacheService.supprimerTache(id);
        return ResponseEntity.noContent().build();
    }
}
