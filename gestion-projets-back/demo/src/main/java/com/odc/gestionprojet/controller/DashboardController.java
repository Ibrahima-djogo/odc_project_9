package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.DashboardStatsResponse;
import com.odc.gestionprojet.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint REST pour le tableau de bord.
 * Necessite un token JWT valide.
 *
 * Base URL : /api/dashboard
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard/stats
     * Retourne les statistiques globales de l'application :
     * nombre de projets par statut, nombre de taches par statut,
     * nombre total de membres et de commentaires.
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> obtenirStatistiques() {
        DashboardStatsResponse stats = dashboardService.obtenirStatistiques();
        return ResponseEntity.ok(stats);
    }
}
