package com.insurepro.claims.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimNoteResponse {
	private Long noteId;
	private Long claimId;
	private Long authorUserId;
	private String noteText;
	private boolean internal;
	private LocalDateTime createdAt;
}
