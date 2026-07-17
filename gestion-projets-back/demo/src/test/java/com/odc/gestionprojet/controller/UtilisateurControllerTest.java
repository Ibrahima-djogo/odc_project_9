package com.odc.gestionprojet.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import com.odc.gestionprojet.security.CustomUserDetailsService;
import com.odc.gestionprojet.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UtilisateurController.class)
@AutoConfigureMockMvc(addFilters = false)
class UtilisateurControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UtilisateurRepository utilisateurRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void shouldUpdateExistingUser() throws Exception {
        Utilisateur existing = new Utilisateur();
        existing.setId(1L);
        existing.setNom("Diallo");
        existing.setPrenom("Mamadou");
        existing.setEmail("old@example.com");
        existing.setMotDePasse("encoded");

        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(utilisateurRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(invocation -> {
            Utilisateur updatedUser = invocation.getArgument(0, Utilisateur.class);
            return Objects.requireNonNull(updatedUser);
        });

        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("nom", "Nouveau");
        payload.put("prenom", "Jean");
        payload.put("email", "new@example.com");

        String requestBody = Objects.requireNonNull(objectMapper.writeValueAsString(payload));
        MediaType mediaType = Objects.requireNonNull(MediaType.APPLICATION_JSON);

        mockMvc.perform(put("/api/utilisateurs/1")
                        .contentType(mediaType)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Nouveau"))
                .andExpect(jsonPath("$.prenom").value("Jean"))
                .andExpect(jsonPath("$.email").value("new@example.com"));

        verify(utilisateurRepository).save(any(Utilisateur.class));
    }
}
