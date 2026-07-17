package com.odc.gestionprojet.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Objects;
import java.util.function.Function;

/**
 * Service responsable de tout ce qui concerne les tokens JWT :
 * - les creer (a la connexion)
 * - en extraire des informations (l'email de l'utilisateur, la date d'expiration)
 * - verifier qu'ils sont valides et pas expires
 *
 * Un JWT contient 3 parties separees par des points : header.payload.signature
 * On ne le dechiffre pas, on le SIGNE : n'importe qui peut LIRE son contenu,
 * mais seul le serveur (qui connait la cle secrete) peut prouver qu'il
 * l'a emis et qu'il n'a pas ete modifie.
 */
@Service
public class JwtService {

    // Recupere la cle secrete et la duree de validite depuis application.properties
    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    /**
     * Genere un nouveau token JWT pour un utilisateur qui vient de se
     * connecter (ou de s'inscrire).
     */
    public String generateToken(UserDetails userDetails) {
        Objects.requireNonNull(userDetails, "userDetails must not be null");
        return Jwts.builder()
                .subject(userDetails.getUsername()) // ici, "username" = l'email
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSignInKey())
                .compact();
    }

    /**
     * Extrait l'email (stocke comme "subject") depuis un token recu.
     */
    public String extractEmail(String token) {
        return extractClaim(token, claims -> claims.getSubject());
    }

    /**
     * Verifie qu'un token est valide POUR un utilisateur donne :
     * - l'email contenu dans le token correspond bien a cet utilisateur
     * - le token n'est pas expire
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        Objects.requireNonNull(userDetails, "userDetails must not be null");
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, claims -> claims.getExpiration());
    }

    /**
     * Methode generique pour extraire n'importe quelle information
     * (claim) contenue dans le token.
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Objects.requireNonNull(token, "token must not be null");
        final Claims claims = Objects.requireNonNull(extractAllClaims(token), "JWT claims cannot be null");
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        Objects.requireNonNull(token, "token must not be null");
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Transforme notre cle secrete (une chaine de caracteres dans
     * application.properties) en objet cryptographique utilisable
     * pour signer/verifier les tokens.
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
