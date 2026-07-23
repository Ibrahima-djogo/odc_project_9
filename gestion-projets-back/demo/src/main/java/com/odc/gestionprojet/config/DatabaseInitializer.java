package com.odc.gestionprojet.config;

import com.odc.gestionprojet.entity.*;
import com.odc.gestionprojet.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Initialiseur de base de données.
 * Permet de peupler automatiquement la base de données avec des données
 * de démonstration cohérentes au lancement de l'application si celle-ci
 * est vide. Pratique pour les tests locaux et la présentation.
 */
@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final CommentaireRepository commentaireRepository;
    private final MembreProjetRepository membreProjetRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Si aucun utilisateur n'existe en base, on initialise le jeu de données de
        // démo
        if (utilisateurRepository.count() == 0) {
            System.out.println("=== INITIALISATION DE LA BASE DE DONNEES ===");

            // -----------------------------------------------------------------
            // 1. CREATION DES UTILISATEURS PAR DEFAUT
            // -----------------------------------------------------------------
            String defaultPassword = passwordEncoder.encode("password123");

            // Administrateur global — a tous les droits sur tous les projets
            Utilisateur admin = new Utilisateur();
            admin.setPrenom("Admin");
            admin.setNom("ODC");
            admin.setEmail("admin.odc@odc.gn");
            admin.setMotDePasse(defaultPassword);
            admin.setRoleGlobal("ADMIN");
            admin = utilisateurRepository.save(admin);

            // Utilisateurs standards — rôle global 'MEMBRE'
            // Leurs permissions varient selon le projet (table membres_projet)
            Utilisateur djogo = new Utilisateur();
            djogo.setPrenom("Ibrahima Djogo");
            djogo.setNom("Bah");
            djogo.setEmail("ibrahima.bah@odc.gn");
            djogo.setMotDePasse(defaultPassword);
            djogo.setRoleGlobal("MEMBRE");
            djogo = utilisateurRepository.save(djogo);

            Utilisateur djiba = new Utilisateur();
            djiba.setPrenom("Djiba");
            djiba.setNom("KABA");
            djiba.setEmail("djiba.kaba@odc.gn");
            djiba.setMotDePasse(defaultPassword);
            djiba.setRoleGlobal("MEMBRE");
            djiba = utilisateurRepository.save(djiba);

            Utilisateur binta = new Utilisateur();
            binta.setPrenom("Fatoumata Binta");
            binta.setNom("BARRY");
            binta.setEmail("fatoumata.barry@odc.gn");
            binta.setMotDePasse(defaultPassword);
            binta.setRoleGlobal("MEMBRE");
            binta = utilisateurRepository.save(binta);

            Utilisateur fanta = new Utilisateur();
            fanta.setPrenom("Fanta");
            fanta.setNom("DIALLO");
            fanta.setEmail("fanta.diallo@odc.gn");
            fanta.setMotDePasse(defaultPassword);
            fanta.setRoleGlobal("MEMBRE");
            fanta = utilisateurRepository.save(fanta);

            Utilisateur mohamed = new Utilisateur();
            mohamed.setPrenom("Mohamed Chérif");
            mohamed.setNom("BANGOURA");
            mohamed.setEmail("mohamed.cherif@odc.gn");
            mohamed.setMotDePasse(defaultPassword);
            mohamed.setRoleGlobal("MEMBRE");
            mohamed = utilisateurRepository.save(mohamed);

            Utilisateur younoussa = new Utilisateur();
            younoussa.setPrenom("Younoussa");
            younoussa.setNom("BAH");
            younoussa.setEmail("younoussa.bah@odc.gn");
            younoussa.setMotDePasse(defaultPassword);
            younoussa.setRoleGlobal("MEMBRE");
            younoussa = utilisateurRepository.save(younoussa);

            System.out.println("-> 1 administrateur + 6 utilisateurs MEMBRE créés (mot de passe: password123)");

            // -----------------------------------------------------------------
            // 2. CREATION DES PROJETS
            // -----------------------------------------------------------------
            // Le statut de chaque projet est desormais entierement calcule a
            // partir de ses taches (voir TacheService.recalculerStatutProjet) :
            // PLANIFIE si aucune tache EN_COURS/TERMINE, EN_COURS des qu'une
            // tache est EN_COURS, TERMINE seulement si TOUTES le sont. Ce
            // seeder appelle directement les repositories (pas TacheService),
            // donc il doit lui-meme choisir des valeurs coherentes avec les
            // taches creees plus bas — sinon la prochaine tache modifiee sur
            // ce projet ecrasera silencieusement la valeur mise ici.

            // Projet 1 : Plateforme E-Commerce Multi-vendeurs (créé par Mamadou)
            // -> t1 TERMINE + t2 EN_COURS = EN_COURS (pas toutes terminees, une EN_COURS)
            Projet p1 = new Projet();
            p1.setNom("Plateforme E-Commerce Multi-vendeurs");
            p1.setDescription("Développement d’une application web complète de vente en ligne avec paiement sécurisé.");
            p1.setDateFin(LocalDate.of(2026, 6, 30));
            p1.setStatut("EN_COURS");
            p1.setPriorite("HAUTE");
            p1.setBudget(new BigDecimal("150000.00"));
            p1.setCreateur(mohamed);
            p1 = projetRepository.save(p1);

            // Projet 2 : Application Mobile de Télémédecine (créé par Mamadou)
            // -> t3 EN_COURS = EN_COURS
            Projet p2 = new Projet();
            p2.setNom("Application Mobile de Télémédecine");
            p2.setDescription("Système mobile de prise de rendez-vous médical et consultation à distance.");
            p2.setDateFin(LocalDate.of(2026, 7, 15));
            p2.setStatut("EN_COURS");
            p2.setPriorite("NORMALE");
            p2.setBudget(new BigDecimal("95000.00"));
            p2.setCreateur(younoussa);
            p2 = projetRepository.save(p2);

            // Projet 3 : Refonte de Charte & Site Vitrine (créé par Aïssatou)
            // -> t4 TERMINE (seule tache du projet) = TERMINE
            Projet p3 = new Projet();
            p3.setNom("Refonte de Charte & Site Vitrine");
            p3.setDescription("Modernisation de l’identité visuelle, optimisation SEO et design responsive.");
            p3.setDateFin(LocalDate.of(2026, 4, 25));
            p3.setStatut("TERMINE");
            p3.setPriorite("BASSE");
            p3.setBudget(new BigDecimal("25000.00"));
            p3.setCreateur(djiba);
            p3 = projetRepository.save(p3);

            System.out.println("-> 3 projets de démonstration créés");

            // -----------------------------------------------------------------
            // 3. AFFECTATION DES MEMBRES AUX PROJETS (AVEC LEUR ROLE DANS CHAQUE PROJET)
            // -----------------------------------------------------------------
            // Projet 1 membres
            creerMembreProjet(p1, mohamed, "CHEF_PROJET");
            creerMembreProjet(p1, binta, "DEVELOPPEUR");
            creerMembreProjet(p1, djiba, "DESIGNER");

            // Projet 2 membres
            creerMembreProjet(p2, younoussa, "CHEF_PROJET");
            creerMembreProjet(p2, fanta, "TESTEUR");
            creerMembreProjet(p2, mohamed, "DEVELOPPEUR");

            // Projet 3 membres
            creerMembreProjet(p3, djiba, "CHEF_PROJET");

            System.out.println("-> Affectation des membres aux projets terminée");

            // -----------------------------------------------------------------
            // 4. CREATION DES TACHES
            // -----------------------------------------------------------------
            // Tâche 1 (Projet 1) : Concevoir la maquette du catalogue produit
            Tache t1 = new Tache();
            t1.setNom("Concevoir la maquette du catalogue produit");
            t1.setDescription("Créer les vues desktop et mobile avec une expérience utilisateur fluide.");
            t1.setStatut("TERMINE");
            t1.setDateLimite(LocalDate.of(2026, 4, 20));
            t1.setProjet(p1);
            t1.setAssigneA(djiba);
            t1 = tacheRepository.save(t1);

            // Tâche 2 (Projet 1) : Développer les API REST de panier d’achat
            Tache t2 = new Tache();
            t2.setNom("Développer les API REST de panier d’achat");
            t2.setDescription("Mettre en place les endpoints Spring Boot pour la gestion du panier.");
            t2.setStatut("EN_COURS");
            t2.setDateLimite(LocalDate.of(2026, 5, 10));
            t2.setProjet(p1);
            t2.setAssigneA(binta);
            t2 = tacheRepository.save(t2);

            // Tâche 3 (Projet 2) : Créer l’interface de prise de rendez-vous
            Tache t3 = new Tache();
            t3.setNom("Créer l’interface de prise de rendez-vous");
            t3.setDescription("Intégration du calendrier interactif pour le choix du praticien.");
            t3.setStatut("EN_COURS");
            t3.setDateLimite(LocalDate.of(2026, 5, 15));
            t3.setProjet(p2);
            t3.setAssigneA(mohamed);
            t3 = tacheRepository.save(t3);

            // Tâche 4 (Projet 3) : seule tâche du projet, déjà terminée — cohérent
            // avec le statut TERMINE fixé sur p3 ci-dessus.
            Tache t4 = new Tache();
            t4.setNom("Livrer la nouvelle charte graphique et le site vitrine");
            t4.setDescription("Déploiement final validé par le client, refonte identité visuelle et SEO incluse.");
            t4.setStatut("TERMINE");
            t4.setDateLimite(LocalDate.of(2026, 4, 20));
            t4.setProjet(p3);
            t4.setAssigneA(djiba);
            t4 = tacheRepository.save(t4);

            System.out.println("-> 4 tâches de démonstration créées");

            // -----------------------------------------------------------------
            // 5. CREATION DES COMMENTAIRES sur les tâches
            // -----------------------------------------------------------------
            Commentaire c1 = new Commentaire();
            c1.setContenu("Maquette validée par le client !");
            c1.setTache(t1);
            c1.setAuteur(djiba);
            commentaireRepository.save(c1);

            System.out.println("-> Commentaires de démonstration créés");
            System.out.println("=== FIN INITIALISATION DE LA BASE DE DONNEES ===");
        }
    }

    /**
     * Méthode utilitaire pour associer un utilisateur à un projet avec un rôle
     * spécifique.
     */
    private void creerMembreProjet(Projet projet, Utilisateur utilisateur, String roleProjet) {
        MembreProjet membre = new MembreProjet();
        membre.setProjet(projet);
        membre.setUtilisateur(utilisateur);
        membre.setRoleProjet(roleProjet);
        membreProjetRepository.save(membre);
    }
}
