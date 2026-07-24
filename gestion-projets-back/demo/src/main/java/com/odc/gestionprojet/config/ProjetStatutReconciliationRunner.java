package com.odc.gestionprojet.config;

import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Tache;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.TacheRepository;
import com.odc.gestionprojet.service.ProjetStatutCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Resynchronise, a CHAQUE demarrage, le statut de tous les projets existants
 * avec l'etat reel de leurs taches (meme regle que
 * TacheService.recalculerStatutProjet, via ProjetStatutCalculator — jamais
 * dupliquee).
 *
 * Pourquoi ce runner est necessaire (et pas juste TacheService) :
 * - DatabaseInitializer ne peuple les donnees de demo QUE sur une base vide ;
 *   il ne touche jamais aux projets deja crees par de vrais utilisateurs.
 * - Le statut d'un projet cree ou modifie AVANT l'introduction du calcul
 *   automatique (ou via une manipulation directe en base) peut ne pas
 *   correspondre a la regle actuelle (ex: un projet dont toutes les taches
 *   sont "A_FAIRE" mais dont le statut est reste "EN_COURS").
 *
 * Execution idempotente et peu couteuse (une passe sur les projets et leurs
 * taches) : sans danger de la laisser tourner a chaque redemarrage, elle ne
 * modifie que les projets dont le statut calcule differe du statut stocke.
 *
 * @Order(2) : s'execute apres DatabaseInitializer.
 */
@Component
@RequiredArgsConstructor
@Order(2)
public class ProjetStatutReconciliationRunner implements CommandLineRunner {

    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Projet> projets = projetRepository.findAll();
        int corriges = 0;

        for (Projet projet : projets) {
            List<Tache> tachesProjet = tacheRepository.findByProjetId(projet.getId());
            String statutCorrect = ProjetStatutCalculator.calculerStatut(tachesProjet);

            if (!statutCorrect.equals(projet.getStatut())) {
                System.out.println("-> Correction statut projet '" + projet.getNom() + "' : "
                        + projet.getStatut() + " -> " + statutCorrect);
                projet.setStatut(statutCorrect);
                projetRepository.save(projet);
                corriges++;
            }
        }

        if (corriges > 0) {
            System.out.println("=== " + corriges + " projet(s) resynchronise(s) avec le statut de leurs taches ===");
        }
    }
}
