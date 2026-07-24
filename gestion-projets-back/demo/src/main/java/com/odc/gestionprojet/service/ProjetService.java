package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.ProjetRequest;
import java.util.List;
import com.odc.gestionprojet.dto.ProjetResponse;
import com.odc.gestionprojet.entity.MembreProjet;
import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier pour la gestion des projets.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreProjetRepository membreProjetRepository;

    /**
     * Cree un nouveau projet pour l'utilisateur connecte.
     */
    public ProjetResponse creerProjet(ProjetRequest request, Long createurId) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(createurId, "createurId must not be null");

        Utilisateur createur = utilisateurRepository.findById(createurId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", createurId));

        Projet projet = new Projet();
        projet.setNom(request.getNom());
        projet.setDescription(request.getDescription());
        projet.setDateFin(request.getDateFin());
        // Le statut n'est jamais fourni par le client : un projet nait
        // toujours PLANIFIE (valeur par defaut de l'entite), il ne changera
        // qu'automatiquement, au gre de ses taches (TacheService).
        projet.setPriorite(request.getPriorite() != null ? request.getPriorite() : "NORMALE");
        projet.setBudget(request.getBudget());
        projet.setCreateur(createur);

        Projet sauvegarde = projetRepository.save(projet);

        // ----- Gestion des rôles -----
        // 1. Ajouter le créateur comme CHEF_PROJET (si aucun chef n'est fourni, il reste le chef).
        final Long chefId = request.getChefDeProjetId() != null ? request.getChefDeProjetId() : createurId;
        Utilisateur chef = utilisateurRepository.findById(chefId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", chefId));

        // Ajouter le chef au projet (peut être le créateur ou un autre utilisateur)
        MembreProjet membreChef = new MembreProjet();
        membreChef.setProjet(sauvegarde);
        membreChef.setUtilisateur(chef);
        membreChef.setRoleProjet("CHEF_PROJET");
        membreProjetRepository.save(membreChef);

        // 2. Ajouter les membres supplémentaires (si fournis)
        List<Long> idsMembres = request.getMembreIdsAffectes();
        if (idsMembres != null) {
            for (Long membreId : idsMembres) {
                // Ignorer si déjà ajouté comme chef ou créateur
                if (Objects.equals(membreId, chefId)) continue;
                Utilisateur utilisateur = utilisateurRepository.findById(membreId)
                        .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", membreId));
                MembreProjet mp = new MembreProjet();
                mp.setProjet(sauvegarde);
                mp.setUtilisateur(utilisateur);
                mp.setRoleProjet("MEMBRE");
                membreProjetRepository.save(mp);
            }
        }

        return toResponse(sauvegarde);
    }

    /**
     * Retourne tous les projets accessibles par un utilisateur
     * (projets dont il est createur OU membre).
     */
    @Transactional(readOnly = true)
    public List<ProjetResponse> listerProjetsUtilisateur(Long utilisateurId) {
        Objects.requireNonNull(utilisateurId, "utilisateurId must not be null");
        return projetRepository
                .findProjetsAccessiblesParUtilisateur(utilisateurId)
                .stream()
                .map(projet -> toResponse(projet))
                .collect(Collectors.toList());
    }

    /**
     * Retourne tous les projets (vue admin).
     */
    @Transactional(readOnly = true)
    public List<ProjetResponse> listerTousProjets() {
        return projetRepository.findAll()
                .stream()
                .map(projet -> toResponse(projet))
                .collect(Collectors.toList());
    }

    /**
     * Retourne un projet par son identifiant.
     */
    @Transactional(readOnly = true)
    public ProjetResponse obtenirProjet(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));
        return toResponse(projet);
    }

    /**
     * Met a jour les informations d'un projet existant.
     */
    public ProjetResponse modifierProjet(Long projetId, ProjetRequest request) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Objects.requireNonNull(request, "request must not be null");

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));

        projet.setNom(request.getNom());
        projet.setDescription(request.getDescription());
        projet.setDateFin(request.getDateFin());
        // Le statut n'est pas modifiable ici : il reste entierement pilote
        // par l'avancement des taches (voir TacheService.recalculerStatutProjet).
        if (request.getPriorite() != null) projet.setPriorite(request.getPriorite());
        projet.setBudget(request.getBudget());

        Projet mis_a_jour = projetRepository.save(projet);
        return toResponse(mis_a_jour);
    }

    /**
     * Supprime un projet et en cascade toutes ses taches et membres.
     */
    public void supprimerProjet(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        if (!projetRepository.existsById(projetId)) {
            throw new ResourceNotFoundException("Projet", projetId);
        }
        projetRepository.deleteById(projetId);
    }

    /**
     * Met à jour le budget d'un projet spécifique.
     */
    public ProjetResponse modifierBudgetProjet(Long projetId, java.math.BigDecimal budget) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet", projetId));
        projet.setBudget(budget);
        Projet misAJour = projetRepository.save(projet);
        return toResponse(misAJour);
    }

    // =========================================================================
    // METHODE UTILITAIRE DE MAPPING
    // =========================================================================

    /**
     * Convertit une entite Projet en ProjetResponse (DTO).
     * Evite d'exposer les relations JPA (qui peuvent provoquer des boucles JSON).
     */
    private ProjetResponse toResponse(Projet projet) {
        Objects.requireNonNull(projet, "projet must not be null");

        ProjetResponse response = new ProjetResponse();
        response.setId(projet.getId());
        response.setNom(projet.getNom());
        response.setDescription(projet.getDescription());
        response.setDateCreation(projet.getDateCreation());
        response.setDateFin(projet.getDateFin());
        response.setStatut(projet.getStatut());
        response.setPriorite(projet.getPriorite());
        response.setBudget(projet.getBudget());
        response.setCreateurId(projet.getCreateur().getId());
        response.setCreateurNom(projet.getCreateur().getNom());
        response.setCreateurPrenom(projet.getCreateur().getPrenom());
        response.setNombreTaches(projet.getTaches().size());
        response.setNombreMembres(projet.getMembres().size());
        response.setProgression(ProjetStatutCalculator.calculerProgression(projet.getTaches()));

        // Déterminer le rôle contextuel et les droits de gestion de l'utilisateur connecté
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String email = auth.getName();
                utilisateurRepository.findByEmail(email).ifPresent(user -> {
                    // 1. Si l'utilisateur est ADMIN global, il a tous les droits
                    if ("ADMIN".equals(user.getRoleGlobal())) {
                        response.setCurrentUserRole("ADMIN");
                        response.setUserHasManagerRights(true);
                    } else {
                        // 2. Sinon (MEMBRE global), vérifier son rôle contextuel sur ce projet
                        membreProjetRepository.findByProjetIdAndUtilisateurId(projet.getId(), user.getId())
                                .ifPresent(membre -> {
                                    response.setCurrentUserRole(membre.getRoleProjet());
                                    // Seul le CHEF_PROJET a les droits de gestion sur ce projet
                                    if ("CHEF_PROJET".equals(membre.getRoleProjet())) {
                                        response.setUserHasManagerRights(true);
                                    }
                                });
                    }
                });
            }
        } catch (Exception e) {
            // Ignorer si pas de contexte de sécurité (ex: tests ou initialisation)
        }

        return response;
    }
}
