package com.odc.gestionprojet;

import com.odc.gestionprojet.entity.MembreProjet;
import com.odc.gestionprojet.entity.Projet;
import com.odc.gestionprojet.entity.Utilisateur;
import com.odc.gestionprojet.repository.MembreProjetRepository;
import com.odc.gestionprojet.repository.ProjetRepository;
import com.odc.gestionprojet.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class DemoApplicationTests {

	@Autowired
	private ProjetRepository projetRepository;

	@Autowired
	private UtilisateurRepository utilisateurRepository;

	@Autowired
	private MembreProjetRepository membreProjetRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void testFindProjetsAccessiblesParUtilisateur() {
		Utilisateur userA = new Utilisateur();
		userA.setNom("NomA");
		userA.setPrenom("PrenomA");
		userA.setEmail("userA@test.com");
		userA.setMotDePasse("password");
		userA = utilisateurRepository.save(userA);

		Utilisateur userB = new Utilisateur();
		userB.setNom("NomB");
		userB.setPrenom("PrenomB");
		userB.setEmail("userB@test.com");
		userB.setMotDePasse("password");
		userB = utilisateurRepository.save(userB);

		Projet projet = new Projet();
		projet.setNom("Test Project");
		projet.setCreateur(userA);
		projet = projetRepository.save(projet);

		MembreProjet membre = new MembreProjet();
		membre.setProjet(projet);
		membre.setUtilisateur(userB);
		membre.setRoleProjet("MEMBRE");
		membreProjetRepository.save(membre);

		List<Projet> projetsA = projetRepository.findProjetsAccessiblesParUtilisateur(userA.getId());
		List<Projet> projetsB = projetRepository.findProjetsAccessiblesParUtilisateur(userB.getId());

		assertTrue(projetsA.contains(projet), "Creator should be able to see the project");
		assertTrue(projetsB.contains(projet), "Member should be able to see the project");
	}

}
