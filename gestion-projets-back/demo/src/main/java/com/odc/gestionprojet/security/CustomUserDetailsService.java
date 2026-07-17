package com.odc.gestionprojet.security;

import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Fait le pont entre notre entite "Utilisateur" et l'interface
 * "UserDetails" que Spring Security sait manipuler.
 *
 * Spring Security appelle automatiquement loadUserByUsername() chaque
 * fois qu'il a besoin de retrouver un utilisateur (par exemple pendant
 * la verification d'un token JWT).
 *
 * Remarque : on utilise l'EMAIL comme "username" puisque c'est ce qui
 * identifie un utilisateur chez nous (pas de champ "username" separe).
 */
@Service
@RequiredArgsConstructor // Lombok genere un constructeur avec les champs "final" ci-dessous
public class CustomUserDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Aucun utilisateur trouve avec l'email : " + email));

        // roleGlobal ("ADMIN", "CHEF_DE_PROJET" ou "MEMBRE") devient une
        // GrantedAuthority "ROLE_xxx", ce qui permet d'utiliser
        // @PreAuthorize("hasRole('ADMIN')") sur les endpoints qui en ont besoin.
        // Les controles plus fins (droits par projet/tache) restent geres
        // "a la main" via RoleCheckService, independamment de ces autorites.
        return new User(
                utilisateur.getEmail(),
                utilisateur.getMotDePasse(),
                List.of(new SimpleGrantedAuthority("ROLE_" + utilisateur.getRoleGlobal()))
        );
    }
}
