package com.odc.gestionprojet.repository;

import com.odc.gestionprojet.entity.Mail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository pour l'entite Mail.
 */
public interface MailRepository extends JpaRepository<Mail, Long> {

    /**
     * Recupere tous les mails ou l'email donne est destinataire OU expediteur,
     * du plus recent au plus ancien.
     */
    List<Mail> findByDestinataireIgnoreCaseOrExpediteurIgnoreCaseOrderByDateEnvoiDesc(
            String destinataire, String expediteur);
}
