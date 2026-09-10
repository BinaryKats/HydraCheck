# HydraCheck

Real-time waterlogging prediction for Delhi — **Smart India Hackathon 2026**

---

## Project Structure

```
HydraCheck/
├── frontend/          React + Leaflet (Vercel)
├── backend/           Node.js + Express (Railway)
├── ml/                Python + FastAPI ML pipeline (Railway)
├── docs/              Obsidian vault mirror
├── docker-compose.yml Local dev orchestration
└── .env.example       Required environment variables
```

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# ML engine
cd ml && pip install -r requirements.txt && uvicorn src.predict:app --reload
```

## Tech Stack

| Layer            | Tech                                      |
|------------------|-------------------------------------------|
| Frontend         | React 19, Vite, Leaflet, Tailwind CSS 4   |
| Backend API      | Node.js, Express                         |
| ML Engine        | Python, FastAPI, XGBoost / LightGBM       |
| Database         | Supabase (PostgreSQL + Auth)             |
| Cache            | Upstash Redis                             |
| Deploy (FE)      | Vercel                                    |
| Deploy (BE/ML)   | Railway                                   |

## Documentation

See [`docs/`](docs/) for full architecture, design, and drainage methodology notes.

## License

Built for SIH 2026 by **BinaryKats**
