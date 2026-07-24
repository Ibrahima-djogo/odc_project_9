package com.odc.gestionprojet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// @EnableAsync : necessaire pour que @Async (EmailService) s'execute
// reellement sur un thread separe. Sans cette annotation, Spring ignore
// @Async et execute la methode de facon synchrone, comme une methode normale.
@SpringBootApplication
@EnableAsync
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
