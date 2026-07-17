-- Script SQL de secours pour créer les tables manuellement dans MariaDB
-- Utilisation :
--   mysql -h localhost -u Admin -p6611 < src/main/resources/database/mariadb-schema.sql

CREATE DATABASE IF NOT EXISTS gestion_projet_collaborative;
USE gestion_projet_collaborative;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    date_creation DATETIME NOT NULL,
    date_fin DATE NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'EN_COURS',
    priorite VARCHAR(20) NULL DEFAULT 'NORMALE',
    budget DECIMAL(12,2) NULL,
    id_createur BIGINT NOT NULL,
    CONSTRAINT fk_projets_createur FOREIGN KEY (id_createur) REFERENCES utilisateurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS membres_projet (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_projet BIGINT NOT NULL,
    id_utilisateur BIGINT NOT NULL,
    role_projet VARCHAR(50) NOT NULL DEFAULT 'MEMBRE',
    date_ajout DATETIME NOT NULL,
    CONSTRAINT fk_membres_projet_projet FOREIGN KEY (id_projet) REFERENCES projets(id),
    CONSTRAINT fk_membres_projet_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id),
    CONSTRAINT uk_membres_projet UNIQUE (id_projet, id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS taches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'A_FAIRE',
    date_limite DATE NULL,
    date_creation DATETIME NOT NULL,
    id_projet BIGINT NOT NULL,
    id_assigne BIGINT NULL,
    CONSTRAINT fk_taches_projet FOREIGN KEY (id_projet) REFERENCES projets(id),
    CONSTRAINT fk_taches_assigne FOREIGN KEY (id_assigne) REFERENCES utilisateurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS commentaires (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contenu VARCHAR(1000) NOT NULL,
    date_creation DATETIME NOT NULL,
    id_tache BIGINT NOT NULL,
    id_auteur BIGINT NOT NULL,
    CONSTRAINT fk_commentaires_tache FOREIGN KEY (id_tache) REFERENCES taches(id),
    CONSTRAINT fk_commentaires_auteur FOREIGN KEY (id_auteur) REFERENCES utilisateurs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
