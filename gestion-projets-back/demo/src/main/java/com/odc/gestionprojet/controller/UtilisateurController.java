package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.RegisterRequest;
import com.odc.gestionprojet.dto.UpdateUtilisateurRequest;
import com.odc.gestionprojet.dto.UtilisateurResponse;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.service.RoleCheckService;
import com.odc.gestionprojet.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Endpoints REST pour la gestion générale des utilisateurs.
 * Nécessite un token JWT valide.
 *
 * Base URL : /api/utilisateurs
 */
@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurService utilisateurService;
    private final RoleCheckService roleCheckService;

    /**
     * GET /api/utilisateurs
     * Retourne la liste des collaborateurs visibles par l'utilisateur connecté :
     * - ADMIN : tous les utilisateurs de la plateforme.
     * - MEMBRE / CHEF_DE_PROJET : uniquement lui-même et les personnes avec
     *   qui il partage au moins un projet (confidentialité des comptes).
     */
    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> listerTousLesUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.listerUtilisateursVisibles());
    }

    /**
     * GET /api/utilisateurs/moi
     * Retourne le profil complet de l'utilisateur actuellement connecté.
     */
    @GetMapping("/moi")
    public ResponseEntity<java.util.Map<String, Object>> getMonProfil(org.springframework.security.core.Authentication authentication) {
        String email = authentication.getName();
        var utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", 0L));
        
        java.util.Map<String, Object> profil = new java.util.HashMap<>();
        profil.put("id", utilisateur.getId());
        profil.put("nom", utilisateur.getNom());
        profil.put("prenom", utilisateur.getPrenom());
        profil.put("email", utilisateur.getEmail());
        profil.put("role", utilisateur.getRoleGlobal());
        profil.put("roleGlobal", utilisateur.getRoleGlobal());

        return ResponseEntity.ok(profil);
    }

    /**
     * POST /api/utilisateurs
     * Cree un nouvel utilisateur depuis l'interface d'administration.
     * Reserve a l'ADMIN (l'inscription publique passe par POST /api/auth/register,
     * pas par ce endpoint). @PreAuthorize s'appuie sur la GrantedAuthority
     * "ROLE_ADMIN" desormais fournie par CustomUserDetailsService.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UtilisateurResponse> creerUtilisateur(@Valid @RequestBody RegisterRequest request) {
        UtilisateurResponse response = utilisateurService.creerUtilisateur(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /api/utilisateurs/{id}
     * Met à jour les informations d'un utilisateur existant.
     * Réservé à l'ADMIN (peut modifier n'importe quel membre) ou à
     * l'utilisateur lui-même (peut modifier son propre profil).
     */
    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> modifierUtilisateur(
            @PathVariable @NonNull Long id,
            @Valid @RequestBody UpdateUtilisateurRequest request) {

        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();
        if (!roleCheckService.estAdmin(connecte) && !connecte.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez modifier que votre propre profil.");
        }

        UtilisateurResponse response = utilisateurService.mettreAJourUtilisateur(id, request);
        return ResponseEntity.ok(response);
    }
}
