# FlowBridge

> Enterprise B2B Document Processing & Integration Platform

FlowBridge is an asynchronous document processing platform built with **Java 17, Spring Boot 3, RabbitMQ, and React**. It enables businesses to submit, validate, and deliver critical documents (Invoices, Orders, Credit Notes) across enterprise partner networks with complete transaction integrity and zero data loss.

---

## 🚀 Key Features

- **Asynchronous Ingestion**: REST API gateway (`POST /api/v1/documents`) returns instant `202 Accepted` receipts with tracking IDs, offloading processing to RabbitMQ message queues.
- **Dual-Protocol Communication**: Public REST APIs for client integration combined with high-speed internal **gRPC and Protocol Buffers** for microservice validation checks.
- **Enterprise Validation Engine**: Automated 3-way purchase order matching and over-credit fraud prevention in PostgreSQL before delivery.
- **6-Stage State Machine**: Strictly tracks document lifecycle (`RECEIVED` → `VALIDATING` → `VALIDATED` → `PROCESSING` → `DELIVERING` → `DELIVERED`) with immutable audit event logging.
- **Dead-Letter Queue (DLQ)**: Quarantines failed messages via RabbitMQ DLX with an automated 3-retry policy and dedicated reprocessing APIs.
- **Multi-Tenant Security**: Stateless JWT authentication with Role-Based Access Control (RBAC) ensuring enterprise data isolation.
- **Interactive UI**: Clean React and TypeScript dashboard with live document tracking.

---

## 🛠 Tech Stack

- **Backend**: Java, Spring Boot, REST APIs, gRPC & Protocol Buffers, RabbitMQ
- **Database**: PostgreSQL
- **Frontend**: React, TypeScript
- **DevOps & Monitoring**: Docker, Docker Compose, Micrometer, Prometheus

---

## 🏛 System Flow

```text
       Client / Frontend (REST)
                  │
                  ▼
             API Service ──────── (Sync gRPC Port 9090) ────────┐
                  │                                             │
                  ▼ (RabbitMQ)                                  ▼
        document.received.queue                        Processing Service
                  │                                     (Validation Engine)
                  ▼                                             ▲
          Processing Service (State Engine)                     │
                  │                                             │
                  ▼ (RabbitMQ)                                  │
         document.deliver.queue                                 │
                  │                                             │
                  ▼                                             │
          Delivery Service ────► External Partner (Simulated)   │
                  │                                             │
                  └────────────► [ RabbitMQ DLQ ] (3 Retries) ──┘
```

---

## 🏃 Quick Start

### 1. Start Infrastructure (PostgreSQL & RabbitMQ)
```bash
cd infrastructure
docker compose up -d postgres rabbitmq
```

### 2. Start Microservices
Run each service in a separate terminal:

```bash
# API Service (Port 8081)
cd api-service
..\mvnw.cmd spring-boot:run

# Processing Service (Port 8082, gRPC 9090)
cd processing-service
..\mvnw.cmd spring-boot:run

# Delivery Service (Port 8083)
cd delivery-service
..\mvnw.cmd spring-boot:run
```

### 3. Start Frontend UI
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.