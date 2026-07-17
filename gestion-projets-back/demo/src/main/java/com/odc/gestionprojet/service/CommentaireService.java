package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.CommentaireRequest;
import com.odc.gestionprojet.dto.CommentaireResponse;
import com.odc.gestionprojet.entity.Commentaire;
import com.odc.gestionprojet.entity.Tache;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.CommentaireRepository;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.TacheRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier pour la gestion des commentaires sur les taches.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final TacheRepository tacheRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final RoleCheckService roleCheckService;

    /**
     * Ajoute un commentaire sur une tache.
     * Accessible a l'ADMIN, au chef du projet, ou a tout membre affecte au
     * projet de cette tache (memes regles que la lecture).
     *
     * @param tacheId  identifiant de la tache concernee
     * @param request  contenu du commentaire
     * @param auteurId identifiant de l'utilisateur qui commente
     */
    public CommentaireResponse ajouterCommentaire(Long tacheId, CommentaireRequest request, Long auteurId) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(auteurId, "auteurId must not be null");

        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));

        verifierAccesAuProjetDeLaTache(tache);

        Utilisateur auteur = utilisateurRepository.findById(auteurId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", auteurId));

        Commentaire commentaire = new Commentaire();
        commentaire.setContenu(request.getContenu());
        commentaire.setTache(tache);
        commentaire.setAuteur(auteur);

        Commentaire sauvegarde = commentaireRepository.save(commentaire);
        return toResponse(sauvegarde);
    }

    /**
     * Retourne tous les commentaires d'une tache, tries du plus ancien au plus recent.
     * Accessible a l'ADMIN, au chef du projet, ou a tout membre affecte au projet
     * de cette tache (pas seulement l'assigne de la tache elle-meme).
     */
    @Transactional(readOnly = true)
    public List<CommentaireResponse> listerCommentairesTache(Long tacheId) {
        Objects.requireNonNull(tacheId, "tacheId must not be null");
        Tache tache = tacheRepository.findById(tacheId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache", tacheId));

        verifierAccesAuProjetDeLaTache(tache);

        return commentaireRepository.findByTacheIdOrderByDateCreationAsc(tacheId)
                .stream()
                .map(commentaire -> toResponse(commentaire))
                .collect(Collectors.toList());
    }

    /**
     * Verifie que l'utilisateur connecte peut lire/ecrire les commentaires de
     * cette tache : ADMIN, membre du projet, OU l'utilisateur auquel la tache
     * est directement assignee (meme s'il n'est pas formellement membre du
     * projet dans membres_projet). Leve 403 sinon.
     */
    private void verifierAccesAuProjetDeLaTache(Tache tache) {
        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();
        if (roleCheckService.estAdmin(connecte)) {
            return;
        }

        boolean estAssigne = tache.getAssigneA() != null
                && tache.getAssigneA().getId().equals(connecte.getId());
        if (estAssigne) {
            return;
        }

        Long projetId = tache.getProjet().getId();
        boolean estMembreDuProjet = membreProjetRepository
                .existsByProjetIdAndUtilisateurId(projetId, connecte.getId());

        if (!estMembreDuProjet) {
            throw new AccessDeniedException(
                    "Vous devez etre membre du projet ou assigne a cette tache pour interagir avec ses commentaires.");
        }
    }

    /**
     * Supprime un commentaire par son identifiant.
     */
    public void supprimerCommentaire(Long commentaireId) {
        Objects.requireNonNull(commentaireId, "commentaireId must not be null");
        if (!commentaireRepository.existsById(commentaireId)) {
            throw new ResourceNotFoundException("Commentaire", commentaireId);
        }
        commentaireRepository.deleteById(commentaireId);
    }

    /**
     * Modifie le contenu d'un commentaire.
     */
    public CommentaireResponse modifierCommentaire(Long commentaireId, CommentaireRequest request) {
        Objects.requireNonNull(commentaireId, "commentaireId must not be null");
        Objects.requireNonNull(request, "request must not be null");

        Commentaire commentaire = commentaireRepository.findById(commentaireId)
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire", commentaireId));

        commentaire.setContenu(request.getContenu());
        Commentaire mis_a_jour = commentaireRepository.save(commentaire);
        return toResponse(mis_a_jour);
    }

    // =========================================================================
    // METHODE UTILITAIRE DE MAPPING
    // =========================================================================

    private CommentaireResponse toResponse(Commentaire commentaire) {
        Objects.requireNonNull(commentaire, "commentaire must not be null");

        CommentaireResponse response = new CommentaireResponse();
        response.setId(commentaire.getId());
        response.setContenu(commentaire.getContenu());
        response.setDateCreation(commentaire.getDateCreation());
        response.setTacheId(commentaire.getTache().getId());
        response.setTacheNom(commentaire.getTache().getNom());
        response.setAuteurId(commentaire.getAuteur().getId());
        response.setAuteurNom(commentaire.getAuteur().getNom());
        response.setAuteurPrenom(commentaire.getAuteur().getPrenom());
        return response;
    }
}
