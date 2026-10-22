package com.insurepro.claims.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor
@Builder
public class AddNoteRequest {
	@NotBlank 
	@Size(min=5, max=2000) 
	private String noteText;
	private boolean internal; }
