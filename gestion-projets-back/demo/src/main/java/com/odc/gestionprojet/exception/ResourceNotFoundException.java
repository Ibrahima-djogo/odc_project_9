package com.odc.gestionprojet.exception;

/**
 * Exception levee quand une ressource demandee n'existe pas en base.
 * Exemple : GET /api/projets/999 alors qu'aucun projet n'a l'id 999.
 * Sera traduite en HTTP 404 Not Found par le GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructeur pratique pour generer automatiquement le message.
     * Exemple : new ResourceNotFoundException("Projet", 42L)
     * -> "Projet introuvable avec l'id : 42"
     */
    public ResourceNotFoundException(String ressource, Long id) {
        super(ressource + " introuvable avec l'id : " + id);
    }
}
