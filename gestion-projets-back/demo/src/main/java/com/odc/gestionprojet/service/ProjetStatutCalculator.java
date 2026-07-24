package com.odc.gestionprojet.service;

import com.odc.gestionprojet.entity.Tache;

import java.util.List;

/**
 * Calcule le statut d'un projet et son pourcentage d'avancement a partir de
 * l'etat de ses taches. Fonction pure et sans etat (aucune dependance,
 * aucun acces base de donnees) : partagee par TacheService (recalcul a
 * chaud a chaque mutation de tache) et ProjetStatutReconciliationRunner
 * (nettoyage au demarrage), pour ne jamais dupliquer la regle metier.
 */
public final class ProjetStatutCalculator {

    private ProjetStatutCalculator() {
    }

    /**
     * Regles, dans cet ordre :
     * 1. Aucune tache, ou aucune n'est encore demarree/terminee -> PLANIFIE.
     * 2. Des qu'au moins une tache est EN_COURS -> EN_COURS.
     * 3. Uniquement quand TOUTES les taches sont TERMINE -> TERMINE.
     */
    public static String calculerStatut(List<Tache> tachesProjet) {
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

    /**
     * Pourcentage d'avancement (0-100), avec credit partiel pour les taches
     * en cours afin que la barre de progression avance de facon continue au
     * lieu de bondir de 0% a 100% d'un coup :
     * - TERMINE  -> compte pour 100% de son poids
     * - EN_COURS -> compte pour 50% de son poids (travail entame, pas fini)
     * - A_FAIRE  -> compte pour 0%
     * Ex : un projet d'une seule tache EN_COURS affiche 50%, pas 0%.
     */
    public static int calculerProgression(List<Tache> tachesProjet) {
        if (tachesProjet.isEmpty()) {
            return 0;
        }
        double total = 0.0;
        for (Tache tache : tachesProjet) {
            if ("TERMINE".equals(tache.getStatut())) {
                total += 1.0;
            } else if ("EN_COURS".equals(tache.getStatut())) {
                total += 0.5;
            }
        }
        return (int) Math.round((total / tachesProjet.size()) * 100.0);
    }
}
