package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.DashboardStatsResponse;
import com.odc.gestionprojet.repository.CommentaireRepository;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.TacheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Logique metier pour le tableau de bord.
 * Agregation des statistiques globales de l'application.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final CommentaireRepository commentaireRepository;

    /**
     * Calcule et retourne les statistiques globales :
     * - Nombre de projets par statut
     * - Nombre de taches par statut
     * - Nombre total de membres
     * - Nombre total de commentaires
     */
    public DashboardStatsResponse obtenirStatistiques() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        // ---- Statistiques projets ----
        stats.setTotalProjets(projetRepository.count());
        stats.setProjetsPlanifies(projetRepository.findByStatut("PLANIFIE").size());
        stats.setProjetsEnCours(projetRepository.findByStatut("EN_COURS").size());
        stats.setProjetsTermines(projetRepository.findByStatut("TERMINE").size());

        // ---- Statistiques taches ----
        stats.setTotalTaches(tacheRepository.count());
        stats.setTachesAFaire(compterTachesParStatut("A_FAIRE"));
        stats.setTachesEnCours(compterTachesParStatut("EN_COURS"));
        stats.setTachesTerminees(compterTachesParStatut("TERMINE"));

        // ---- Statistiques membres et commentaires ----
        stats.setTotalMembres(membreProjetRepository.count());
        stats.setTotalCommentaires(commentaireRepository.count());

        return stats;
    }

    /**
     * Compte toutes les taches d'un statut donne, tous projets confondus.
     * On utilise une boucle sur findAll pour rester simple sans ajouter
     * une methode specifique dans le repository.
     */
    private long compterTachesParStatut(String statut) {
        return tacheRepository.findAll()
                .stream()
                .filter(t -> statut.equals(t.getStatut()))
                .count();
    }
}
