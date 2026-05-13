# MediTrack Sensor Frontend (`meditrack-sensor-frontend`)

## Overview
MediTrack Sensor Frontend is a Vue 3 + Vite application organized with a domain-driven design (DDD) style. The project demonstrates how to model features by bounded context and keep business concepts separated from UI and infrastructure concerns.

The current implementation includes bounded contexts for establishments, IAM, logistics, monitoring, and subscriptions, with shared infrastructure for API communication and common UI components.

## Goals
- Show a practical front-end architecture with DDD-inspired layering.
- Keep domain concepts explicit through bounded contexts.
- Provide a clean learning base for CRUD use cases, localization, role-based access, and routing in a healthcare sensor monitoring system.

## Tech Stack
- Vue 3
- Vite
- Pinia
- Vue Router
- Vue I18n
- PrimeVue + PrimeFlex + PrimeIcons
- Axios
- Chart.js + vue-chartjs

## Project Structure (DDD-Oriented)
```text
src/
  iam/                         # IAM bounded context
    presentation/              # Views and route declarations

  establishment/               # Establishment bounded context
    presentation/              # Views and route declarations

  logistics/                   # Logistics bounded context
    presentation/              # Views and route declarations

  monitoring/                  # Monitoring bounded context
    presentation/              # Views and route declarations
    components/                # Shared components like control-center-panel

  subscriptions/               # Subscriptions bounded context
    presentation/              # Views and route declarations

  shared/                      # Shared cross-context concerns
    infrastructure/            # BaseApi, BaseEndpoint, dashboard service
    presentation/              # Layout and shared views/components

  locales/                     # Internationalization files (en.json, es.json)
```

## Bounded Contexts

### Establishment Context
Manages health establishments, operators, and assignments.

- Views for listing establishments, creating new ones, assigning operators, viewing operators, and a map of establishments.
- Uses shared dashboard service for data fetching.

### IAM Context
Handles identity and access management.

- Includes profile view with logout functionality.
- Role-based login selection (health-entity or operational-staff).

### Logistics Context
Manages transportation and logistics.

- View for transports, including fleet and cold chain monitoring.

### Monitoring Context
Handles device monitoring and control.

- View for devices with real-time sensor monitoring.
- Includes control center panel component.

### Subscriptions Context
Manages subscription plans.

- View for selecting plans.

### Shared Context
Provides reusable infrastructure and presentation utilities.

- `BaseApi` centralizes Axios configuration.
- `BaseEndpoint` centralizes CRUD endpoint behavior.
- Dashboard service fetches data from multiple APIs.
- Shared UI structure, login, home views for different roles, and common components.

## Layer Responsibilities

### Presentation Layer
- Renders UI and handles user interactions.
- Calls infrastructure services directly or via stores (though stores are minimal here).
- Includes views, components, and route declarations.

### Infrastructure Layer
- Talks to external services/APIs.
- Provides base classes for API communication and CRUD operations.
- Dashboard service aggregates data from various endpoints.

## Running the Project

### Prerequisites
- Node.js + npm installed (use versions compatible with Vite 8).

### 1) Install dependencies
```bash
npm install
```

### 2) Start the Vue app
```bash
npm run dev
```

### 3) Build for production
```bash
npm run build
```

### 4) Preview production build
```bash
npm run preview
```

## Environment Variables
Environment files included:
- `.env.development`
- `.env.production`

Main variables:
- `VITE_VITAL_CARE_API_URL` (development base URL)
- `VITE_MEDITRACK_SENSOR_US_AD_API` (users/admins API)
- `VITE_MEDITRACK_SENSOR_SUB_EST_API` (subscriptions/establishments API)
- `VITE_MEDITRACK_SENSOR_DV_API` (devices API)
- `VITE_MEDITRACK_SENSOR_OP_TR_API` (operators/transports API)
- Endpoint paths like `VITE_ESTABLISHMENT_ENDPOINT_PATH`, etc.

Tip: In development, it uses localhost:5000; in production, mockapi.io URLs for different services.

## Routing Notes
- Routes are organized by bounded context under `/establishment`, `/monitoring`, etc.
- Login selects user role and redirects to role-specific home.
- Global `beforeEach` sets the document title from route metadata.
- Base title: `MediTrack Sensor`

## API and Data Notes
- Uses multiple external APIs for different services (users, subscriptions, devices, etc.).
- Dashboard fetches aggregated data from all APIs.
- No local mock server; relies on external services or mock APIs in production.

## Recommended Development Practices
- Keep each feature inside its bounded context first; move to `shared` only when truly cross-context.
- Preserve separation between presentation and infrastructure.
- Prefer explicit domain language in naming and docs.
- Add or update docs when introducing new entities or use cases.
