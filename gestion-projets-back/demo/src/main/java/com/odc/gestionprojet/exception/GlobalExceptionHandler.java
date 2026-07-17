package com.odc.gestionprojet.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.stream.Collectors;

/**
 * Intercepte toutes les exceptions levees par les controllers/services
 * et les convertit en reponses HTTP propres avec notre format ErrorResponse.
 *
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody :
 *                       - @ControllerAdvice : intercepte les exceptions sur
 *                       tous les controllers
 *                       - @ResponseBody : serialise automatiquement la reponse
 *                       en JSON
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        /**
         * 404 - Ressource introuvable
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleResourceNotFound(
                        ResourceNotFoundException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        /**
         * 409 - Conflit (ex: email deja utilise, membre deja dans le projet)
         */
        @ExceptionHandler(ConflictException.class)
        public ResponseEntity<ErrorResponse> handleConflict(
                        ConflictException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        /**
         * 400 - Erreurs de validation (@Valid sur les RequestBody).
         * On concatene tous les messages de champs invalides pour une reponse claire.
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(
                        MethodArgumentNotValidException ex, HttpServletRequest request) {

                String details = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(fieldError -> fieldError.getDefaultMessage())
                                .collect(Collectors.joining(", "));

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                details,
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        /**
         * 400 - Arguments illegaux (ex: statut invalide passe a un service)
         */
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgument(
                        IllegalArgumentException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Bad Request",
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        /**
         * 401 - Non authentifie (token manquant ou invalide)
         */
        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ErrorResponse> handleAuthentication(
                        AuthenticationException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                "Authentification requise",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        /**
         * 403 - Acces refuse (authentifie mais pas autorise)
         */
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDenied(
                        AccessDeniedException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.FORBIDDEN.value(),
                                "Forbidden",
                                "Acces refuse : vous n'avez pas les droits necessaires",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        /**
         * 404 - Route inconnue (aucun @RestController ne correspond a l'URL).
         * Necessite spring.mvc.throw-exception-if-no-handler-found=true et
         * spring.web.resources.add-mappings=false (voir application.properties),
         * sinon Spring Boot sert sa page Whitelabel HTML par defaut.
         */
        @ExceptionHandler(NoHandlerFoundException.class)
        public ResponseEntity<ErrorResponse> handleNoHandlerFound(
                        NoHandlerFoundException ex, HttpServletRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Not Found",
                                "Route inexistante : " + ex.getHttpMethod() + " " + ex.getRequestURL(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        /**
         * 4xx/5xx - Exceptions volontairement levees via ResponseStatusException
         * (ex: RoleCheckService.exigerChefDeProjetGlobal / exigerChefDeProjetSurProjet).
         * Sans ce handler, Spring les traite via son resolveur par defaut et le
         * corps de reponse n'a pas le meme format JSON que le reste de l'API.
         */
        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ErrorResponse> handleResponseStatus(
                        ResponseStatusException ex, HttpServletRequest request) {

                HttpStatusCode statusCode = ex.getStatusCode();
                ErrorResponse error = new ErrorResponse(
                                statusCode.value(),
                                HttpStatus.valueOf(statusCode.value()).getReasonPhrase(),
                                ex.getReason() != null ? ex.getReason() : "Erreur",
                                request.getRequestURI());
                return ResponseEntity.status(statusCode).body(error);
        }

        /**
         * 409 - Violation de contrainte SQL (cle etrangere, unicite, colonne
         * non-nullable, etc.) remontee par Hibernate/JDBC. Sans ce handler,
         * ces erreurs finissent dans handleGeneric en 500, ce qui est
         * trompeur : ce sont des erreurs de donnees (409), pas des pannes serveur.
         */
        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
                        DataIntegrityViolationException ex, HttpServletRequest request) {

                log.warn("Violation de contrainte d'integrite sur {} : {}", request.getRequestURI(), ex.getMessage());
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.CONFLICT.value(),
                                "Conflict",
                                "Operation impossible : elle viole une contrainte d'integrite des donnees "
                                                + "(cle etrangere, unicite, ou champ obligatoire).",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        /**
         * 500 - Toute autre exception non prevue (filet de securite).
         * Le detail technique (stacktrace) est journalise cote serveur uniquement ;
         * le client ne recoit qu'un message generique, pour eviter toute fuite
         * d'information (nom de classe d'exception, message interne, etc.).
         */
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
                log.error("Erreur interne non geree sur {}", request.getRequestURI(), ex);
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                "Une erreur interne est survenue. Veuillez reessayer plus tard.",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
}
