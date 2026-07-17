package com.odc.gestionprojet.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre execute UNE FOIS pour chaque requete HTTP entrante (avant
 * qu'elle n'atteigne nos controllers).
 *
 * Son role :
 * 1. Regarder si la requete contient un header "Authorization: Bearer <token>"
 * 2. Si oui, extraire le token et verifier qu'il est valide
 * 3. Si valide, dire a Spring Security "cette requete vient bien de
 *    cet utilisateur authentifie" pour le reste du traitement
 * 4. Si pas de token ou token invalide, laisser passer sans authentifier
 *    (ce sera ensuite SecurityConfig qui decidera si la route demandee
 *    necessite une authentification ou pas)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
     ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Si pas de header, ou s'il ne commence pas par "Bearer ",
        // on laisse passer la requete sans authentification
        // (utile pour les routes publiques comme /api/auth/login)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // On enleve "Bearer " (7 caracteres) pour ne garder que le token
        final String jwt = authHeader.substring(7);

        try {
            final String email = jwtService.extractEmail(jwt);

            // On verifie qu'on n'a pas deja authentifie cette requete plus tot
            // dans la chaine de filtres (evite du travail redondant)
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException | UsernameNotFoundException | IllegalArgumentException ex) {
            // Token expire, malforme, signature invalide, ou utilisateur du token
            // supprime entre-temps : on ne plante pas la requete, on la laisse
            // simplement non authentifiee. C'est SecurityConfig (authenticationEntryPoint)
            // qui renverra alors un 401 JSON propre si la route necessite une authentification.
            log.debug("Token JWT invalide ou expire : {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
