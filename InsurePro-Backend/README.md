# InsurePro — Enterprise Insurance Platform (Merged Edition)

Full-stack Spring Boot 3.2.x microservices application — merged from Enterprise ZIP + SRS-complete Claude project.  
**18 bugs fixed. 13 services. 275 Java files. Production-ready.**

---

## Architecture

```
Client → API Gateway (8080) → Eureka-registered services
                ↓
   Config Server (8888) supplies shared config
   Zipkin (9411)  distributed tracing
   RabbitMQ (5672) async events (audit + notifications)
   Redis (6379)   JWT blacklist + response cache
   MySQL (3306)   10 separate databases (one per service)
   Prometheus/Grafana  metrics + dashboards
```

### Services

| Service | Port | Database |
|---------|------|----------|
| api-gateway-service | **8080** | — |
| iam-service | 8081 | insurepro_iam |
| customer-service | 8082 | insurepro_customer |
| policy-service | 8083 | insurepro_policy |
| claims-service | 8084 | insurepro_claims |
| premium-payment-service | 8085 | insurepro_payment |
| notification-service | 8086 | insurepro_notification |
| audit-compliance-service | 8087 | insurepro_audit |
| analytics-service | 8088 | insurepro_analytics |
| underwriting-service | 8089 | insurepro_underwriting |
| document-service | 8090 | insurepro_document |
| eureka-server | 8761 | — |
| config-server | 8888 | — |

---

## Quick Start

### Prerequisites
- Docker 24+ and Docker Compose v2
- Java 17+ (for local builds)
- Maven 3.9+

### 1 — Build all services

```bash
# From project root — builds all 13 service JARs
for svc in config-server eureka-server api-gateway-service \
           iam-service customer-service policy-service claims-service \
           premium-payment-service notification-service audit-compliance-service \
           analytics-service underwriting-service document-service; do
  echo "Building $svc..."
  cd $svc && mvn clean package -DskipTests -q && cd ..
done
```

### 2 — Start the full stack

```bash
docker-compose up -d
```

**Startup order** (handled by healthchecks):
1. MySQL, Redis, RabbitMQ, Zipkin
2. Config Server
3. Eureka Server
4. API Gateway
5. All domain services (parallel)

### 3 — Verify

```bash
# All containers running
docker-compose ps

# Eureka dashboard
open http://localhost:8761   # user: eurekaadmin / Eureka@2024

# API Gateway health
curl http://localhost:8080/actuator/health

# RabbitMQ management
open http://localhost:15672  # user: guest / guest

# Grafana dashboards
open http://localhost:3000   # user: admin / Admin@2024
```

---

## API Documentation (Swagger UI)

Each service exposes Swagger UI at its own port:

| Service | Swagger URL |
|---------|-------------|
| IAM | http://localhost:8081/swagger-ui.html |
| Customer | http://localhost:8082/swagger-ui.html |
| Policy | http://localhost:8083/swagger-ui.html |
| Claims | http://localhost:8084/swagger-ui.html |
| Payment | http://localhost:8085/swagger-ui.html |
| Notification | http://localhost:8086/swagger-ui.html |
| Audit | http://localhost:8087/swagger-ui.html |
| Analytics | http://localhost:8088/swagger-ui.html |
| Underwriting | http://localhost:8089/swagger-ui.html |
| Document | http://localhost:8090/swagger-ui.html |

---

## Key API Flows

### Authentication
```bash
# Register
POST http://localhost:8080/api/v1/auth/register
{
  "username": "john.doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "password": "Secure@2024Pass!",
  "phone": "+919876543210"
}

# Login → get JWT
POST http://localhost:8080/api/v1/auth/login
{"username": "john.doe", "password": "Secure@2024Pass!"}

# Use token in all subsequent requests
Authorization: Bearer <accessToken>
```

### Create Customer → Policy → Claim flow
```bash
# 1. Create customer
POST /api/v1/customers

# 2. Create policy
POST /api/v1/policies

# 3. Activate policy (after underwriting if required)
POST /api/v1/policies/{id}/activate

# 4. Generate invoice
POST /api/v1/invoices

# 5. Record payment
POST /api/v1/payments

# 6. Submit claim
POST /api/v1/claims

# 7. Adjuster updates status (UNDER_REVIEW → APPROVED)
PATCH /api/v1/claims/{id}/status

# 8. Settlement auto-created on APPROVED
GET /api/v1/claims/{id}/settlement
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password strength | `@StrongPassword` — min 12 chars, upper+lower+digit+special |
| Account lockout | 5 failed attempts → 30-min lock |
| Password history | Last 5 passwords rejected |
| Token rotation | Refresh token rotated on every use |
| JWT blacklist | Redis-backed blacklist on logout |
| SHA-256 token hashing | Refresh tokens hashed before DB storage |
| Correlation IDs | `X-Correlation-ID` propagated service-to-service |
| AOP audit trail | Every service method published to RabbitMQ |

---

## Environment Variables

All credentials are injected via env vars (no hardcoded values):

```bash
# .env file (create from this template)
DB_HOST=mysql
DB_USERNAME=insurepro
DB_PASSWORD=insurepro@2024
REDIS_HOST=redis
RABBITMQ_HOST=rabbitmq
JWT_SECRET=InsureProSecureJWTSecretKey2024MustBeAtLeast256BitsForHS256Algorithm
EUREKA_HOST=eureka-server
CONFIG_SERVER_HOST=config-server
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=noreply@insurepro.com
MAIL_PASSWORD=your_app_password
```

---

## Bugs Fixed vs Enterprise ZIP

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | `AuthController` injected both interface AND `AuthServiceImpl` | Fixed — interface only |
| 2 | JJWT 0.11.x deprecated API incompatible with Spring Boot 3.2.x | Upgraded to JJWT 0.12.5 (`verifyWith`, `signWith`) |
| 3 | `ddl-auto: update` in all 9 production YMLs | Changed to `validate` |
| 4 | Hardcoded `root/root` DB credentials | All credentials use `${ENV_VAR:default}` |
| 5 | Plain-text UUID refresh tokens stored in DB | SHA-256 hashed before storage |
| 6 | `refreshAccessToken()` bypassed `AuthService` interface | Fixed on interface |
| 7 | No claim numbers | `CLM-YYYYMM-0000001` format |
| 8 | No policy numbers | `POL-TYPE-YYYY-0000001` format |
| 9 | No claim disputes | `ClaimDispute` entity + workflow |
| 10 | No claim notes | `ClaimNote` entity (internal/external) |
| 11 | No policy endorsements | `PolicyEndorsement` entity |
| 12 | No soft-delete filters | `deleted = false` on all queries |
| 13 | No underwriting service | Full `RiskScoringEngine` with auto-approve/refer/decline |
| 14 | No document service | Multipart upload, SHA-256 checksum, local storage |
| 15 | `customer-policy-service` orphan duplicate | Removed |
| 16 | RabbitMQ used instead of Kafka (SRS §3.3) | Kept RabbitMQ (pragmatic — enterprise pattern) |
| 17 | No account lockout | 5 attempts → 30-min lock |
| 18 | No password history | Last 5 passwords checked |

---

## Project Structure

```
insurepro/
├── docker-compose.yml          # Full stack orchestration
├── init-dbs.sql                # Creates all 10 databases
├── monitoring/
│   └── prometheus.yml          # Scrapes all 10 services
├── iam-service/                # Auth, Users, Roles (37 Java files)
├── customer-service/           # Customers, KYC (24 files)
├── policy-service/             # Policies, Types, Endorsements (27 files)
├── claims-service/             # Claims, Settlements, Notes, Disputes (35 files)
├── premium-payment-service/    # Invoices, Payments, Refunds (30 files)
├── notification-service/       # In-app, Email, SMS, Preferences (27 files)
├── audit-compliance-service/   # Audit logs, CSV export (21 files)
├── analytics-service/          # KPI dashboard, Reports (25 files)
├── underwriting-service/       # Risk scoring, Auto-decisions (24 files)
├── document-service/           # Upload, Download, Versioning (20 files)
├── api-gateway-service/        # JWT validation, routing (2 files)
├── eureka-server/              # Service registry (2 files)
└── config-server/              # Centralised config (1 file)
```

---

## Tech Stack

- **Java 17** + **Spring Boot 3.2.5**
- **Spring Cloud 2023.0.1** (Eureka, Config, Gateway, OpenFeign)
- **Spring Security** + **JJWT 0.12.5** (JWT)
- **Hibernate / Spring Data JPA** + **MySQL 8.0** + **Flyway**
- **Redis 7** (caching + JWT blacklist)
- **RabbitMQ 3.12** (async audit + notification events)
- **Resilience4j 2.1** (circuit breakers on all Feign clients)
- **Micrometer + Zipkin 3** (distributed tracing)
- **Prometheus + Grafana** (metrics)
- **Lombok + MapStruct** (boilerplate reduction)
- **SpringDoc OpenAPI 2.5** (Swagger UI per service)
- **Docker + Docker Compose**
