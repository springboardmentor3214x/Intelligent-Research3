# Module 6: Technology Intelligence

## 1. Overview
The **Technology Intelligence** module provides an end-to-end framework for analyzing technologies across research literature, patent filings, organizational participation, and adoption metrics.

### Key Capabilities
1. **Emerging Technology Identification**: Identifies rapid growth in publications and patent filings using compound annual growth rates (CAGR) and acceleration metrics.
2. **Technology Maturity Analysis**: A 0–100 weighted index evaluating 6 core indicators to classify technologies into:
   - `Emerging`
   - `Growth`
   - `Mature`
   - `Saturated`
   - `Insufficient Data`
3. **Separate Technology Adoption Tracking**: Evaluated **independently** from research and patent momentum, ensuring technologies with high research output but low enterprise deployment are clearly distinguished.
4. **Innovation Opportunity Signals**: Algorithmic detection of white spaces, adoption gaps, growth spikes, research-application gaps, and organizational surges.
5. **Competitive / Institutional Monitoring**: Tracks top universities, research institutes, and corporations by paper volume, patent count, and momentum.
6. **Transparent Data Provenance**: Discloses live sources (OpenAlex, PatentsView) versus synthetic benchmark data with visual `DEMO DATA` indicators and clear evidence-based rationales.

---

## 2. Architecture & Data Flow

```
   [ OpenAlex API ]        [ PatentsView API ]
          │                         │
          ▼                         ▼
   research_data_service   patent_data_service
          │                         │
          └────────────┬────────────┘
                       ▼
            technology_sync_service
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
 trend_service  maturity_service  opportunity_service
       │               │               │
       └───────────────┼───────────────┘
                       ▼
            PostgreSQL / SQLAlchemy
                       ▼
         FastAPI (/api/technologies)
                       ▼
          React 18 + Pure SVG Charts
```

---

## 3. Indicator Calculation & Weighting Model

The technology maturity composite score (0–100) is calculated from 6 normalized indicators:

| Indicator | Weight | Data Source | Calculation Basis |
|-----------|--------|-------------|-------------------|
| **Research Growth Rate** | 25% | OpenAlex | 3-year & 5-year compound growth in academic papers |
| **Patent Growth Rate** | 25% | PatentsView | 3-year & 5-year compound growth in patent filings |
| **Research Activity Level** | 15% | OpenAlex | Normalized total publication volume |
| **Patent Activity Level** | 15% | PatentsView | Normalized total patent grants |
| **Organization Participation** | 10% | OpenAlex / PatentsView | Unique institutional ecosystem breadth |
| **Application Diversity** | 10% | Semantic analysis | Number of distinct cross-domain applications |

### Maturity Stages
- **Emerging**: Score < 35, high growth rate with early stage activity.
- **Growth**: Score 35 – 65, expanding publication and patent acceleration.
- **Mature**: Score 65 – 85, established institutional adoption and steady patent portfolios.
- **Saturated**: Score > 85, plateauing or decelerating growth with high absolute volume.

---

## 4. API Endpoints

All endpoints are mounted under `/api/technologies`:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/technologies` | Public | List all monitored technologies with domain, stage, and score |
| `GET` | `/api/technologies/emerging` | Public | List emerging technologies filtered by minimum growth rate |
| `GET` | `/api/technologies/{id}` | Public | Detailed technology overview |
| `GET` | `/api/technologies/{id}/history` | Public | Multi-year historical publication and patent counts |
| `GET` | `/api/technologies/{id}/maturity` | Public | Complete 6-indicator score and stage breakdown |
| `GET` | `/api/technologies/{id}/adoption` | Public | Independent adoption level and trend analysis |
| `GET` | `/api/technologies/{id}/opportunities`| Public | Technology-specific innovation opportunity signals |
| `GET` | `/api/technologies/{id}/competitors` | Public | Top institutions and commercial organizations |
| `GET` | `/api/technologies/{id}/sources` | Public | Status and provenance logs for data sources |
| `GET` | `/api/opportunities` | Public | Global list of detected innovation opportunity signals |
| `POST`| `/api/technologies/sync` | Auth | Trigger live ingestion from OpenAlex and PatentsView |
| `POST`| `/api/technologies/{id}/recalculate` | Auth | Recalculate indicators and maturity score |

---

## 5. Frontend Visual Components

- **`TechnologyIntelligencePage.jsx`**: Main module view featuring interactive tabs (Technology Catalog, Emerging Tech Radar, Innovation Opportunities, Deep-Dive View), domain filters, stage filters, and sync triggers.
- **`MiniLineChart.jsx`**: Pure SVG multi-line chart with dual-axis scaling, area fills, and hover tooltips for multi-year academic vs. patent trajectories.
- **`MaturityGauge.jsx`**: Pure SVG semicircular radial gauge with color-coded stage indicators and score meter.
- **`IndicatorBreakdown.jsx`**: Visual progress bars displaying normalized indicator weights and scores.
- **`OpportunityCard.jsx`**: Signals categorized by adoption gap, growth acceleration, and research-patent transfer gap.
- **`CompetitorTable.jsx`**: Institutional ranking by publication and patent shares with trend momentum.
- **`DataSourceBadge.jsx`**: High-visibility badge indicating live API telemetry versus local synthetic demo data.

---

## 6. Demo Seed Data
Pre-loaded benchmark technologies (Quantum Computing, Large Language Models, Edge AI, CRISPR-Cas9, Blockchain) provide immediate local testing capabilities with synthetic trajectories. All seeded entries are explicitly tagged with `is_demo: true` and display the `DEMO DATA` badge.
