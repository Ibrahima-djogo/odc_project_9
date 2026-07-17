package com.odc.gestionprojet.service;

import com.odc.gestionprojet.dto.AuthResponse;
import com.odc.gestionprojet.dto.LoginRequest;
import com.odc.gestionprojet.dto.RegisterRequest;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.exception.ConflictException;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Contient la logique metier de l'authentification : inscription et connexion.
 *
 * Le controller (AuthController) ne fera qu'appeler ces methodes et
 * renvoyer le resultat ; toute la "vraie" logique vit ici.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Inscrit un nouvel utilisateur :
     * 1. Verifie que l'email n'est pas deja pris
     * 2. Hache le mot de passe (jamais stocke en clair)
     * 3. Sauvegarde l'utilisateur en base
     * 4. Genere immediatement un token JWT (pour eviter a l'utilisateur
     *    de devoir se reconnecter juste apres son inscription)
     */
    public AuthResponse register(RegisterRequest request) {

        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Un compte existe deja avec cet email");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        // C'est ICI que le mot de passe est hache avant d'etre stocke.
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        // L'inscription publique cree TOUJOURS un compte MEMBRE, quoi que le
        // client envoie dans "roleGlobal"/"role" (meme "ADMIN" ou
        // "CHEF_DE_PROJET" envoye a la main via curl/Postman). Attribuer ces
        // roles superieurs doit passer exclusivement par l'espace d'admin
        // (UtilisateurService.creerUtilisateur, protege par @PreAuthorize).
        utilisateur.setRoleGlobal("MEMBRE");

        Utilisateur utilisateurSauvegarde = utilisateurRepository.save(utilisateur);

        String token = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        utilisateurSauvegarde.getEmail(),
                        utilisateurSauvegarde.getMotDePasse(),
                        java.util.Collections.emptyList()
                )
        );

        return new AuthResponse(
                token,
                utilisateurSauvegarde.getId(),
                utilisateurSauvegarde.getNom(),
                utilisateurSauvegarde.getPrenom(),
                utilisateurSauvegarde.getEmail(),
                utilisateurSauvegarde.getRoleGlobal()
        );
    }

    /**
     * Connecte un utilisateur existant :
     * 1. Delegue a Spring Security la verification email + mot de passe
     *    (via authenticationManager, qui utilise notre AuthenticationProvider
     *    configure dans SecurityConfig)
     * 2. Si la verification echoue, Spring leve automatiquement une
     *    exception (BadCredentialsException) qu'on laisse remonter
     * 3. Si elle reussit, on genere un nouveau token JWT
     */
    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getMotDePasse()
                )
        );

        // A ce stade, l'authentification a reussi (sinon une exception
        // aurait deja ete levee par authenticationManager.authenticate()).
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException(
                        "Utilisateur authentifie mais introuvable en base, cas anormal"));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                java.util.Collections.emptyList()
        );

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
                token,
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getEmail(),
                utilisateur.getRoleGlobal()
        );
    }
}