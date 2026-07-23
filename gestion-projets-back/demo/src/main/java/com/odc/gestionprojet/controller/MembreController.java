package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.MembreRequest;
import com.odc.gestionprojet.dto.MembreResponse;
import com.odc.gestionprojet.service.MembreService;
import com.odc.gestionprojet.service.RoleCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints REST pour la gestion des membres d'un projet.
 * Tous ces endpoints necessitent un token JWT valide.
 *
 * Droits :
 * - GET (lister) : tout utilisateur authentifié
 * - POST/DELETE/PATCH : CHEF_PROJET sur ce projet (rôle par-projet, ou ADMIN)
 *
 * Base URL : /api/projets/{projetId}/membres
 */
@RestController
@RequestMapping("/api/projets/{projetId}/membres")
@RequiredArgsConstructor
public class MembreController {

    private final MembreService membreService;
    private final RoleCheckService roleCheckService;

    /**
     * POST /api/projets/{projetId}/membres
     * Ajoute un utilisateur comme membre du projet. Réservé au chef du projet.
     */
    @PostMapping
    public ResponseEntity<MembreResponse> ajouterMembre(
            @PathVariable Long projetId,
            @Valid @RequestBody MembreRequest request) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        MembreResponse response = membreService.ajouterMembre(projetId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/projets/{projetId}/membres
     * Retourne la liste de tous les membres du projet (accessible à tous).
     */
    @GetMapping
    public ResponseEntity<List<MembreResponse>> listerMembres(@PathVariable Long projetId) {
        List<MembreResponse> membres = membreService.listerMembres(projetId);
        return ResponseEntity.ok(membres);
    }

    /**
     * DELETE /api/projets/{projetId}/membres/{utilisateurId}
     * Retire un membre du projet. Réservé au chef du projet.
     */
    @DeleteMapping("/{utilisateurId}")
    public ResponseEntity<Void> retirerMembre(
            @PathVariable Long projetId,
            @PathVariable Long utilisateurId) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        membreService.retirerMembre(projetId, utilisateurId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/projets/{projetId}/membres/{utilisateurId}/role
     * Modifie le role/fonction d'un membre dans le projet. Réservé au chef du projet.
     */
    @PatchMapping("/{utilisateurId}/role")
    public ResponseEntity<MembreResponse> modifierRoleMembre(
            @PathVariable Long projetId,
            @PathVariable Long utilisateurId,
            @RequestBody Map<String, String> body) {
        roleCheckService.exigerChefDeProjetSurProjet(projetId);
        String nouveauRoleProjet = body.get("roleProjet");
        if (nouveauRoleProjet == null || nouveauRoleProjet.isBlank()) {
            throw new IllegalArgumentException("Le champ 'roleProjet' est obligatoire dans le corps de la requete");
        }
        MembreResponse response = membreService.modifierRoleMembre(projetId, utilisateurId, nouveauRoleProjet);
        return ResponseEntity.ok(response);
    }
}
