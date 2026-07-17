package com.odc.gestionprojet.exception;

/**
 * Exception levee quand une operation entre en conflit avec une
 * regle d'unicite (ex: un email deja utilise lors de l'inscription).
 *
 * On la traitera plus tard dans un gestionnaire global d'exceptions
 * pour renvoyer un code HTTP 409 (Conflict) propre au client.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}