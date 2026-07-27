package com.odc.gestionprojet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service d'envoi d'e-mails via l'API HTTP de Resend (https://api.resend.com/emails).
 * L'API HTTP est utilisee a la place de SMTP direct car les connexions SMTP sortantes
 * (ports 587/465) sont bloquees sur certains hebergeurs cloud comme Railway.
 *
 * Toute methode d'envoi est @Async : un souci d'envoi (cle API invalide, quota depasse,
 * erreur reseau...) ne doit jamais faire echouer l'operation metier qui a declenche
 * l'e-mail. On journalise l'erreur et on continue.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${resend.api.key}")
    private String cleApiResend;

    @Value("${resend.mail.from}")
    private String adresseExpediteur;

    @Value("${app.mail.frontend-url}")
    private String urlFrontend;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Notifie un utilisateur qu'il vient d'etre affecte a un projet.
     *
     * @param emailDestinataire email du membre affecte
     * @param prenomDestinataire prenom du membre affecte (personnalisation)
     * @param nomProjet          nom du projet concerne
     * @param roleProjet         fonction du membre SUR CE projet (ex: "CHEF_PROJET",
     *                           "DEVELOPPEUR"...), jamais son roleGlobal
     */
    @Async
    public void envoyerNotificationAffectationProjet(String emailDestinataire, String prenomDestinataire,
                                                       String nomProjet, String roleProjet) {
        try {
            String sujet = "Vous avez été ajouté au projet \"" + nomProjet + "\" sur WorkPulse";
            String html = construireContenuHtml(prenomDestinataire, nomProjet, roleProjet);
            envoyerEmailResend(emailDestinataire, sujet, html);
            log.info("E-mail de notification d'affectation envoye a {} (projet '{}')", emailDestinataire, nomProjet);
        } catch (HttpStatusCodeException e) {
            log.error("Echec de l'envoi de l'e-mail de notification a {} (projet '{}') : {}",
                    emailDestinataire, nomProjet, e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Echec de l'envoi de l'e-mail de notification a {} (projet '{}') : {}",
                    emailDestinataire, nomProjet, e.getMessage());
        }
    }

    /**
     * Envoie une invitation a rejoindre un projet par e-mail, que le
     * destinataire ait deja un compte WorkPulse ou non. Le lien pointe vers
     * le frontend avec le token en clair en parametre ("?invite=token") : le
     * frontend l'echange ensuite contre l'apercu public (GET /api/invitations/{token})
     * puis, une fois l'utilisateur connecte/inscrit, contre l'acceptation
     * (POST /api/invitations/{token}/accepter).
     *
     * @param emailDestinataire adresse invitee
     * @param nomProjet         projet concerne
     * @param roleProjet        fonction proposee sur ce projet
     * @param nomInviteur       nom de la personne qui invite (chef de projet ou admin)
     * @param token             token EN CLAIR (jamais persiste ainsi, seul son hash l'est)
     */
    @Async
    public void envoyerInvitationProjet(String emailDestinataire, String nomProjet, String roleProjet,
                                         String nomInviteur, String token) {
        try {
            String lien = urlFrontend + "/?invite=" + token;
            String sujet = nomInviteur + " vous invite à rejoindre \"" + nomProjet + "\" sur WorkPulse";
            String html = construireContenuInvitationHtml(nomProjet, roleProjet, nomInviteur, lien);
            envoyerEmailResend(emailDestinataire, sujet, html);
            log.info("E-mail d'invitation envoye a {} (projet '{}')", emailDestinataire, nomProjet);
        } catch (HttpStatusCodeException e) {
            log.error("Echec de l'envoi de l'e-mail d'invitation a {} (projet '{}') : {}",
                    emailDestinataire, nomProjet, e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Echec de l'envoi de l'e-mail d'invitation a {} (projet '{}') : {}",
                    emailDestinataire, nomProjet, e.getMessage());
        }
    }

    private void envoyerEmailResend(String to, String subject, String htmlContent) {
        String url = "https://api.resend.com/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cleApiResend);

        Map<String, Object> body = new HashMap<>();
        body.put("from", adresseExpediteur);
        body.put("to", List.of(to));
        body.put("subject", subject);
        body.put("html", htmlContent);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Statut HTTP non-2xx recu de Resend: " + response.getStatusCode());
        }
    }

    private String construireContenuInvitationHtml(String nomProjet, String roleProjet, String nomInviteur, String lien) {
        String roleAffiche = (roleProjet == null || roleProjet.isBlank())
                ? "Membre"
                : roleProjet.replace('_', ' ');

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                               style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,0.08);">
                          <tr>
                            <td style="background:#ffb800;padding:24px 32px;text-align:center;">
                              <span style="font-size:22px;font-weight:700;color:#0f172a;">WorkPulse</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <p style="font-size:16px;color:#0f172a;margin:0 0 16px;">Bonjour,</p>
                              <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
                                <strong style="color:#0f172a;">%s</strong> vous invite à rejoindre le projet
                                <strong style="color:#0f172a;">%s</strong> sur WorkPulse,
                                en tant que <strong style="color:#0f172a;">%s</strong>.
                              </p>
                              <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
                                Si vous avez déjà un compte, connectez-vous pour rejoindre le projet en un clic.
                                Sinon, ce lien vous guidera vers une inscription rapide.
                              </p>
                              <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="border-radius:8px;background:#ffb800;">
                                    <a href="%s" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#0f172a;text-decoration:none;">
                                      Accepter l'invitation
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:24px 0 0;">
                                Ce lien expire dans 7 jours.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 32px;background:#f8fafc;text-align:center;">
                              <span style="font-size:12px;color:#94a3b8;">
                                Vous recevez cet e-mail suite à une invitation explicite sur WorkPulse.
                                Si vous ne vous y attendiez pas, ignorez simplement ce message.
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(nomInviteur, nomProjet, roleAffiche, lien);
    }

    private String construireContenuHtml(String prenom, String nomProjet, String roleProjet) {
        String roleAffiche = (roleProjet == null || roleProjet.isBlank())
                ? "Membre"
                : roleProjet.replace('_', ' ');

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="480" cellpadding="0" cellspacing="0"
                               style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,0.08);">
                          <tr>
                            <td style="background:#ffb800;padding:24px 32px;text-align:center;">
                              <span style="font-size:22px;font-weight:700;color:#0f172a;">WorkPulse</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <p style="font-size:16px;color:#0f172a;margin:0 0 16px;">Bonjour %s,</p>
                              <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
                                Vous venez d'être ajouté(e) au projet
                                <strong style="color:#0f172a;">%s</strong> sur WorkPulse,
                                avec le rôle <strong style="color:#0f172a;">%s</strong>.
                              </p>
                              <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
                                Connectez-vous dès maintenant pour découvrir les tâches qui vous attendent
                                sur ce projet.
                              </p>
                              <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="border-radius:8px;background:#ffb800;">
                                    <a href="%s" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#0f172a;text-decoration:none;">
                                      Ouvrir WorkPulse
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 32px;background:#f8fafc;text-align:center;">
                              <span style="font-size:12px;color:#94a3b8;">
                                Vous recevez cet e-mail car un administrateur ou un chef de projet vous a affecté
                                à ce projet sur WorkPulse.
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(prenom, nomProjet, roleAffiche, urlFrontend);
    }
}
