package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.TacheRequest;
import com.odc.gestionprojet.dto.TacheResponse;
import com.odc.gestionprojet.dto.TacheStatutRequest;
import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Tache;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.TacheRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import org.springframework.security.access.AccessDeniedException;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier pour la gestion des taches.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final ProjetRepository projetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final RoleCheckService roleCheckService;

    // Statuts valides pour une tache
    private static final List<String> STATUTS_VALIDES = Arrays.asList("A_FAIRE", "EN_COURS", "TERMINE");

    /**
     * Cree une nouvelle tache dans un projet.
     */
    public TacheResponse creerTache(TacheRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getProjetId(), "projetId must not be null");

        verifierMembreProjet(request.getProjetId());
        Projet projet = projetRepository.findById(request.getProjetId())
                .orElseThrow(() -> new ResourceNotFoundException("Projet", request.getProjetId()));

        Tache tache = new Tache();
        tache.setNom(request.getNom());
        tache.setDescription(request.getDescription());
        tache.setDateLimite(request.getDateLimite());
        tache.setStatut(request.getStatut() != null ? request.getStatut() : "A_FAIRE");
        tache.setProjet(projet);

        // L'assignation est optionnelle
        if (request.getAssigneAId() != null) {
            Utilisateur assigne = utilisateurRepository.findById(request.getAssigneAId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", request.getAssigneAId()));
            tache.setAssigneA(assigne);
        }

        Tache sauvegarde = tacheRepository.save(tache);
        recalculerStatutProjet(projet.getId());
        return toResponse(sauvegarde);
    }

    /**
     * Retourne toutes les taches d'un projet.
     */
    @Transactional(readOnly = true)
    public List<TacheResponse> listerTachesProjet(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        if (!projetRepository.existsById(projetId)) {
            throw new ResourceNotFoundException("Projet", projetId);
        }
        return tacheRepository.findByProjetId(projetId)
                .stream()
                .map(tache -> toResponse(tache))
                .collect(Collectors.toList());
    }

    /**
     * Retourne les taches d'un projet filtrees par statut.
     */
    @Transactional(readOnly = true)
    public List<TacheResponse> listerTachesParStatut(Long projetId, String statut) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        if (!projetRepository.existsById(projetId)) {
            throw new ResourceNotFoundException("Projet", projetId);
        }
        return tacheRepository.findByProjetIdAndStatut(projetId, statut)
                .stream()
                .map(tache -> toResponse(tache))
                .collect(Collectors.toList());
    }

    /**
     * Retourne toutes les taches assignees a un utilisateur.
     */
    @Transactional(readOnly = true)
    public List<TacheResponse> listerTachesUtilisateur(Long utilisateurId) {
        Objects.requireNonNull(utilisateurId, "utilisateurId must not be null");
        if (!utilisateurRepository.existsById(utilisateurId)) {
            throw new ResourceNotFoundException("Utilisateur", utilisateurId);
        }
        return tacheRepository.findByAssigneAId(utilisateurId)
                .stream()
                .map(tache -> toResponse(tache))
                .collect(Collectors.toList());
    }

    /**
     * Retourne une tache par son identifiant.
     */
    @Transactional(readOnly = true)
    public TacheResponse obtenirTache(Long tacheId) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));
        return toResponse(tache);
    }

    /**
     * Met a jour une tache existante.
     */
    public TacheResponse modifierTache(Long tacheId, TacheRequest request) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Objects.requireNonNull(request, "request must not be null");

        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));

        tache.setNom(request.getNom());
        tache.setDescription(request.getDescription());
        tache.setDateLimite(request.getDateLimite());
        if (request.getStatut() != null)
            tache.setStatut(request.getStatut());

        // Mise a jour de l'assigne (null signifie desassigner)
        if (request.getAssigneAId() != null) {
            Utilisateur assigne = utilisateurRepository.findById(request.getAssigneAId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", request.getAssigneAId()));
            tache.setAssigneA(assigne);
        } else {
            tache.setAssigneA(null);
        }

        Tache mis_a_jour = tacheRepository.save(tache);
        recalculerStatutProjet(mis_a_jour.getProjet().getId());
        return toResponse(mis_a_jour);
    }

    /**
     * Met a jour uniquement le statut d'une tache (route PATCH).
     * Valide que le statut fourni est bien un statut valide.
     */
    public TacheResponse changerStatut(Long tacheId, TacheStatutRequest request) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(request.getStatut(), "statut must not be null");

        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));

        if (!STATUTS_VALIDES.contains(request.getStatut())) {
            throw new IllegalArgumentException(
                    "Statut invalide : " + request.getStatut() +
                            ". Valeurs acceptees : " + STATUTS_VALIDES);
        }

        tache.setStatut(request.getStatut());
        Tache mis_a_jour = tacheRepository.save(tache);
        recalculerStatutProjet(mis_a_jour.getProjet().getId());
        return toResponse(mis_a_jour);
    }

    /**
     * Supprime une tache et en cascade tous ses commentaires.
     */
    public void supprimerTache(Long tacheId) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));
        Long projetId = tache.getProjet().getId();
        tacheRepository.delete(tache);
        recalculerStatutProjet(projetId);
    }

    /**
     * Recalcule automatiquement le statut d'un projet a partir de l'etat
     * courant de ses taches (jamais a partir de son statut precedent : ce
     * n'est pas un simple bascule, c'est une fonction pure de l'ensemble des
     * taches, appelee apres chaque creation/modification/suppression de
     * tache). Regles, dans cet ordre :
     * 1. Aucune tache, ou aucune n'est encore demarree/terminee -> PLANIFIE.
     * 2. Des qu'au moins une tache est EN_COURS -> EN_COURS.
     * 3. Uniquement quand TOUTES les taches sont TERMINE -> TERMINE.
     * Le statut d'un projet n'est plus modifiable manuellement ailleurs dans
     * l'application (voir ProjetService) : ce calcul en est la seule source.
     */
    private void recalculerStatutProjet(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");
        Projet projet = projetRepository.findById(projetId).orElse(null);
        if (projet == null) {
            return;
        }
        List<Tache> tachesProjet = tacheRepository.findByProjetId(projetId);
        String statutCalcule = calculerStatutSelonTaches(tachesProjet);

        if (!statutCalcule.equals(projet.getStatut())) {
            projet.setStatut(statutCalcule);
            projetRepository.save(projet);
        }
    }

    private String calculerStatutSelonTaches(List<Tache> tachesProjet) {
        if (tachesProjet.isEmpty()) {
            return "PLANIFIE";
        }
        boolean toutesTerminees = tachesProjet.stream()
                .allMatch(t -> "TERMINE".equals(t.getStatut()));
        if (toutesTerminees) {
            return "TERMINE";
        }
        boolean uneEnCours = tachesProjet.stream()
                .anyMatch(t -> "EN_COURS".equals(t.getStatut()));
        if (uneEnCours) {
            return "EN_COURS";
        }
        return "PLANIFIE";
    }

    // =========================================================================
    // METHODES UTILITAIRES
    // =========================================================================

    /**
     * Verifie que l'utilisateur connecte est membre du projet (ou ADMIN global,
     * qui a implicitement acces a tous les projets).
     * Leve AccessDeniedException (403) si ce n'est pas le cas.
     */
    private void verifierMembreProjet(Long projetId) {
        Objects.requireNonNull(projetId, "projetId must not be null");

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", 0L));

        if ("ADMIN".equals(utilisateur.getRoleGlobal())) {
            return;
        }

        boolean estMembre = membreProjetRepository
                .existsByProjetIdAndUtilisateurId(projetId, utilisateur.getId());
        if (!estMembre) {
            throw new AccessDeniedException(
                    "Vous n'etes pas membre de ce projet et ne pouvez pas y creer de taches.");
        }
    }

    private TacheResponse toResponse(Tache tache) {
        Objects.requireNonNull(tache, "tache must not be null");

        TacheResponse response = new TacheResponse();
        response.setId(tache.getId());
        response.setNom(tache.getNom());
        response.setDescription(tache.getDescription());
        response.setStatut(tache.getStatut());
        response.setDateLimite(tache.getDateLimite());
        response.setDateCreation(tache.getDateCreation());
        response.setProjetId(tache.getProjet().getId());
        response.setProjetNom(tache.getProjet().getNom());
        response.setNombreCommentaires(tache.getCommentaires().size());

        if (tache.getAssigneA() != null) {
            response.setAssigneAId(tache.getAssigneA().getId());
            response.setAssigneANom(tache.getAssigneA().getNom());
            response.setAssigneAPrenom(tache.getAssigneA().getPrenom());
        }

        response.setPeutModifier(peutModifierTache(tache));

        return response;
    }

    /**
     * Determine si l'utilisateur connecte peut modifier cette tache (details
     * ou statut) : ADMIN, chef du projet, ou membre assigne a cette tache
     * precise. Utilise par le frontend pour afficher (ou non) les actions
     * d'edition/deplacement sur les cartes du Kanban.
     */
    private boolean peutModifierTache(Tache tache) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return false;
            }

            Utilisateur connecte = roleCheckService.getUtilisateurConnecte();
            if (roleCheckService.estAdmin(connecte)) {
                return true;
            }

            boolean estAssigne = tache.getAssigneA() != null
                    && tache.getAssigneA().getId().equals(connecte.getId());
            if (estAssigne) {
                return true;
            }

            return roleCheckService.estChefOuAdminSurProjet(tache.getProjet().getId());
        } catch (Exception e) {
            // Contexte sans authentification (tests, initialisation) : par
            // defaut, pas de droit d'edition.
            return false;
        }
    }
}
