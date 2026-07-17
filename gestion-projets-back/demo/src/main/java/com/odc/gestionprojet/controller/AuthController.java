package com.odc.gestionprojet.controller;

import com.odc.gestionprojet.dto.AuthResponse;
import com.odc.gestionprojet.dto.LoginRequest;
import com.odc.gestionprojet.dto.RegisterRequest;
import com.odc.gestionprojet.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints publics lies a l'authentification.
 * Rappel : /api/auth/** est autorise sans token (voir SecurityConfig),
 * c'est normal et necessaire puisqu'on n'a pas encore de token a ce stade.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Corps attendu (JSON) : { "nom": "...", "prenom": "...", "email": "...", "motDePasse": "..." }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Corps attendu (JSON) : { "email": "...", "motDePasse": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}