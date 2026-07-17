package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.ProjetRequest;
import com.odc.gestionprojet.dto.ProjetResponse;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.service.ProjetService;
import com.odc.gestionprojet.service.RoleCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST pour la gestion des projets.
 * Tous ces endpoints necessitent un token JWT valide.
 *
 * Droits :
 * - GET : tout utilisateur authentifié
 * - POST (créer) : CHEF_DE_PROJET global uniquement
 * - PUT (modifier) : CHEF_DE_PROJET sur ce projet (créateur ou membre chef)
 * - DELETE : CHEF_DE_PROJET sur ce projet (créateur ou membre chef)
 *
 * Base URL : /api/projets
 */
@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
public class ProjetController {

    private final ProjetService projetService;
    private final UtilisateurRepository utilisateurRepository;
    private final RoleCheckService roleCheckService;
    private final MembreProjetRepository membreProjetRepository;

    /**
     * POST /api/projets
     * Crée un nouveau projet. Réservé aux CHEF_DE_PROJET globaux.
     */
    @PostMapping
    public ResponseEntity<ProjetResponse> creerProjet(@Valid @RequestBody ProjetRequest request) {
        // Seul un chef de projet global peut créer un projet
        roleCheckService.exigerChefDeProjetGlobal();
        Long createurId = getUtilisateurConnecteId();
        ProjetResponse response = projetService.creerProjet(request, createurId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/projets
     * Retourne tous les projets dont l'utilisateur connecte est createur ou membre.
     * Exception : un ADMIN global voit systematiquement TOUS les projets de la base,
     * sans etre necessairement createur ou membre de chacun d'eux.
     */
    @GetMapping
    public ResponseEntity<List<ProjetResponse>> listerMesProjets() {
        if (roleCheckService.estAdminConnecte()) {
            return ResponseEntity.ok(projetService.listerTousProjets());
        }
        Long utilisateurId = getUtilisateurConnecteId();
        List<ProjetResponse> projets = projetService.listerProjetsUtilisateur(utilisateurId);
        return ResponseEntity.ok(projets);
    }

    /**
     * GET /api/projets/tous
     * Retourne tous les projets (vue globale, accessible à tous).
     */
    @GetMapping("/tous")
    public ResponseEntity<List<ProjetResponse>> listerTousProjets() {
        List<ProjetResponse> projets = projetService.listerTousProjets();
        return ResponseEntity.ok(projets);
    }

    /**
     * GET /api/projets/{id}
     * Retourne un projet par son identifiant.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjetResponse> obtenirProjet(@PathVariable Long id) {
        ProjetResponse response = projetService.obtenirProjet(id);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/projets/{id}
     * Met a jour un projet existant. Réservé au chef de ce projet.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProjetResponse> modifierProjet(
            @PathVariable Long id,
            @Valid @RequestBody ProjetRequest request) {
        // Vérifier que l'appelant est chef sur CE projet
        roleCheckService.exigerChefDeProjetSurProjet(id);
        ProjetResponse response = projetService.modifierProjet(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/projets/{id}/budget
     * Met à jour le budget d'un projet.
     *
     * Double couche de sécurité :
     * 1. Si l'utilisateur est ADMIN global → accès immédiat.
     * 2. Si l'utilisateur est MEMBRE global → vérifier qu'il est CHEF_PROJET sur ce projet.
     * 3. Sinon → 403 Forbidden.
     */
    @PutMapping("/{id}/budget")
    public ResponseEntity<ProjetResponse> modifierBudget(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, java.math.BigDecimal> requestBody) {

        // 1. Récupérer l'utilisateur connecté via le SecurityContext
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur connecté introuvable avec l'email : " + email));

        // 2. Vérification de la double couche de sécurité
        boolean accesAutorise = false;

        // Couche 1 : ADMIN global a tous les droits sur tous les projets
        if ("ADMIN".equals(utilisateur.getRoleGlobal())) {
            accesAutorise = true;
        } else {
            // Couche 2 : MEMBRE global → vérifier le rôle CHEF_PROJET dans membres_projet
            accesAutorise = membreProjetRepository
                    .existsByProjetIdAndUtilisateurIdAndRoleProjet(id, utilisateur.getId(), "CHEF_PROJET");
        }

        // 3. Si aucune condition n'est remplie → 403 Forbidden
        if (!accesAutorise) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // 4. Validation du body et mise à jour du budget
        java.math.BigDecimal nouveauBudget = requestBody.get("budget");
        if (nouveauBudget == null) {
            return ResponseEntity.badRequest().build();
        }

        ProjetResponse response = projetService.modifierBudgetProjet(id, nouveauBudget);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/projets/{id}
     * Supprime un projet et tout ce qu'il contient. Réservé au chef de ce projet.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerProjet(@PathVariable Long id) {
        // Vérifier que l'appelant est chef sur CE projet
        roleCheckService.exigerChefDeProjetSurProjet(id);
        projetService.supprimerProjet(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // METHODE UTILITAIRE
    // =========================================================================

    /**
     * Recupere l'ID de l'utilisateur connecte a partir du token JWT.
     */
    private Long getUtilisateurConnecteId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur connecte introuvable avec l'email : " + email));
        return utilisateur.getId();
    }
}
