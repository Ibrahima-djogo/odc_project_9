package com.odc.gestionprojet.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Objet JSON standardise retourne au client en cas d'erreur.
 * Au lieu de laisser Spring renvoyer un gros stacktrace illisible,
 * on retourne toujours cette structure propre :
 * {
 *   "timestamp": "2025-01-15T10:30:00",
 *   "status": 404,
 *   "erreur": "Not Found",
 *   "message": "Projet introuvable avec l'id : 42",
 *   "chemin": "/api/projets/42"
 * }
 */
@Getter
@Setter
public class ErrorResponse {

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private int status;
    private String erreur;
    private String message;
    private String chemin;

    public ErrorResponse(int status, String erreur, String message, String chemin) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.erreur = erreur;
        this.message = message;
        this.chemin = chemin;
    }
}
