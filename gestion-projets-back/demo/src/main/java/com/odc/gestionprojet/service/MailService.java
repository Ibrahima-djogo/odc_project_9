package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.MailRequest;
import com.odc.gestionprojet.dto.MailResponse;
import com.odc.gestionprojet.entity.Mail;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ResourceNotFoundException;
import com.odc.gestionprojet.repository.MailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Logique metier de la "boite mail" simulee (notifications d'invitation et
 * messages libres entre collaborateurs). Aucun e-mail n'est reellement
 * envoye : tout est persiste en base et affiche dans l'onglet Messagerie.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class MailService {

    private final MailRepository mailRepository;
    private final RoleCheckService roleCheckService;

    /**
     * Retourne les mails ou l'utilisateur connecte est expediteur ou destinataire.
     */
    @Transactional(readOnly = true)
    public List<MailResponse> listerMailsUtilisateurConnecte() {
        String email = roleCheckService.getUtilisateurConnecte().getEmail();
        return mailRepository
                .findByDestinataireIgnoreCaseOrExpediteurIgnoreCaseOrderByDateEnvoiDesc(email, email)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Enregistre un nouveau mail. L'expediteur est toujours deduit de
     * l'utilisateur connecte, jamais d'une valeur fournie par le client.
     */
    public MailResponse envoyerMail(MailRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();

        Mail mail = new Mail();
        mail.setExpediteur(connecte.getEmail());
        mail.setDestinataire(request.getDestinataire().trim().toLowerCase());
        mail.setNomMembre(request.getNomMembre());
        mail.setRoleMembre(request.getRoleMembre());
        mail.setSujet(request.getSujet().trim());
        mail.setMessageTexte(request.getMessageTexte().trim());
        mail.setProjetIdsCsv(
                (request.getProjetIds() == null || request.getProjetIds().isEmpty())
                        ? null
                        : String.join(",", request.getProjetIds()));

        Mail sauvegarde = mailRepository.saveAndFlush(mail);
        return toResponse(sauvegarde);
    }

    /**
     * Supprime un mail. Reserve a l'ADMIN ou a l'un des deux participants
     * (expediteur ou destinataire) de ce mail.
     */
    public void supprimerMail(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        Mail mail = mailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mail", id));

        Utilisateur connecte = roleCheckService.getUtilisateurConnecte();
        boolean estParticipant = mail.getExpediteur().equalsIgnoreCase(connecte.getEmail())
                || mail.getDestinataire().equalsIgnoreCase(connecte.getEmail());

        if (!roleCheckService.estAdmin(connecte) && !estParticipant) {
            throw new AccessDeniedException(
                    "Vous ne pouvez supprimer que les e-mails que vous avez envoyes ou recus.");
        }

        mailRepository.deleteById(id);
    }

    private MailResponse toResponse(Mail mail) {
        List<String> projetIds = (mail.getProjetIdsCsv() == null || mail.getProjetIdsCsv().isBlank())
                ? new ArrayList<>()
                : Arrays.asList(mail.getProjetIdsCsv().split(","));

        return new MailResponse(
                mail.getId(),
                mail.getExpediteur(),
                mail.getDestinataire(),
                mail.getNomMembre(),
                mail.getRoleMembre(),
                mail.getSujet(),
                mail.getMessageTexte(),
                mail.getDateEnvoi(),
                projetIds);
    }
}
