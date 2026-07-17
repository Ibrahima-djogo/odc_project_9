package com.odc.gestionprojet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Objet retourne par le dashboard avec les statistiques globales
 * de l'utilisateur connecte.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    // ---- Statistiques sur les projets ----
    private long totalProjets;
    private long projetsEnCours;
    private long projetsTermines;
    private long projetsEnPause;

    // ---- Statistiques sur les taches (tous projets confondus) ----
    private long totalTaches;
    private long tachesAFaire;
    private long tachesEnCours;
    private long tachesTerminees;

    // ---- Statistiques sur les membres ----
    private long totalMembres;

    // ---- Statistiques sur les commentaires ----
    private long totalCommentaires;
}
