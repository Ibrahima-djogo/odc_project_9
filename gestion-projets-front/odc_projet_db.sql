-- ========================================================
-- SCRIPT SQL MYSQL - PROJET GESTION DE PROJET COLLABORATIVE
-- ODC-GUINEE - Formation FullStack 2026
-- Livrable : Exportation de la Base de Données
-- ========================================================

CREATE DATABASE IF NOT EXISTS `odc_projet_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `odc_projet_db`;

-- Supprimer les tables existantes (ordre des contraintes clés étrangères)
DROP TABLE IF EXISTS `commentaire`;
DROP TABLE IF EXISTS `tache`;
DROP TABLE IF EXISTS `projet`;
DROP TABLE IF EXISTS `membre`;

-- --------------------------------------------------------
-- Table `membre`
-- --------------------------------------------------------
CREATE TABLE `membre` (
  `id` VARCHAR(50) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role` VARCHAR(50) NOT NULL,
  `avatar_url` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `membre` (`id`, `nom`, `prenom`, `email`, `role`, `avatar_url`) VALUES
('m1', 'Diallo', 'Mamadou', 'mamadou.diallo@odc.gn', 'CHEF_PROJET', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('m2', 'Camara', 'Aïssatou', 'aissatou.camara@odc.gn', 'DEVELOPPEUR', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'),
('m3', 'Soumah', 'Ibrahima', 'ibrahima.soumah@odc.gn', 'DESIGNER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('m4', 'Barry', 'Fatoumata', 'fatoumata.barry@odc.gn', 'TESTEUR', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80');

-- --------------------------------------------------------
-- Table `projet`
-- --------------------------------------------------------
CREATE TABLE `projet` (
  `id` VARCHAR(50) NOT NULL,
  `titre` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `date_debut` DATE,
  `date_fin` DATE,
  `statut` VARCHAR(50) NOT NULL,
  `categorie` VARCHAR(100),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `projet` (`id`, `titre`, `description`, `date_debut`, `date_fin`, `statut`, `categorie`) VALUES
('p1', 'Plateforme E-Learning ODC', 'Développement d’un portal de formation continue pour les étudiants guinéens.', '2026-04-10', '2026-06-30', 'EN_COURS', 'Web App'),
('p2', 'Application Mobile Santé Conakry', 'Système de prise de rendez-vous médical et téléconsultation locale.', '2026-05-01', '2026-07-15', 'EN_COURS', 'Mobile'),
('p3', 'Refonte du Site Institutionnel ODC', 'Mise à jour du design system, optimisation SEO et intégration du chatbot IA.', '2026-03-01', '2026-04-25', 'TERMINE', 'Design & Web');

-- --------------------------------------------------------
-- Table `tache`
-- --------------------------------------------------------
CREATE TABLE `tache` (
  `id` VARCHAR(50) NOT NULL,
  `projet_id` VARCHAR(50) NOT NULL,
  `titre` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `statut` VARCHAR(50) NOT NULL,
  `priorite` VARCHAR(50) NOT NULL,
  `date_echeance` DATE,
  `membre_assigne_id` VARCHAR(50),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tache_projet` FOREIGN KEY (`projet_id`) REFERENCES `projet` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tache_membre` FOREIGN KEY (`membre_assigne_id`) REFERENCES `membre` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tache` (`id`, `projet_id`, `titre`, `description`, `statut`, `priorite`, `date_echeance`, `membre_assigne_id`) VALUES
('t1', 'p1', 'Concevoir la maquette Figma du Dashboard', 'Créer les vues desktop et mobile avec la charte graphique Orange ODC.', 'TERMINE', 'HAUTE', '2026-04-20', 'm3'),
('t2', 'p1', 'Implémenter les API REST avec Spring Boot', 'Développer les endpoints pour l’authentification et la gestion des utilisateurs.', 'EN_COURS', 'HAUTE', '2026-05-10', 'm2'),
('t3', 'p1', 'Créer les composants React du Kanban', 'Développer le tableau de bord interactif avec glisser-déposer des cartes.', 'EN_COURS', 'MOYENNE', '2026-05-15', 'm2'),
('t4', 'p1', 'Rédiger le cahier de tests unitaires', 'Préparer les scénarios de test pour la validation finale du projet.', 'A_FAIRE', 'BASSE', '2026-06-01', 'm4'),
('t5', 'p2', 'Modélisation de la base de données MySQL', 'Concevoir le schéma relationnel pour la gestion des rendez-vous et des patients.', 'TERMINE', 'HAUTE', '2026-05-05', 'm2');

-- --------------------------------------------------------
-- Table `commentaire`
-- --------------------------------------------------------
CREATE TABLE `commentaire` (
  `id` VARCHAR(50) NOT NULL,
  `tache_id` VARCHAR(50) NOT NULL,
  `membre_id` VARCHAR(50) NOT NULL,
  `contenu` TEXT NOT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_comm_tache` FOREIGN KEY (`tache_id`) REFERENCES `tache` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comm_membre` FOREIGN KEY (`membre_id`) REFERENCES `membre` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `commentaire` (`id`, `tache_id`, `membre_id`, `contenu`, `date_creation`) VALUES
('c1', 't1', 'm1', 'Superbe travail sur le choix des couleurs !', '2026-04-18 10:30:00'),
('c2', 't2', 'm2', 'La structure des entités est prête, je termine la configuration MySQL.', '2026-04-25 14:15:00');
