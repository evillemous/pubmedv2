# Medical Research Assistant

A full-stack web application that allows users to input medical research ideas, automatically performs literature searches, extracts structured data, runs statistical analysis, and generates formatted manuscripts using OpenAI.

## API Key Configuration

This application requires the following API keys to function properly:

- **OpenAI API Key**: Used for manuscript generation and voice transcription
- **Entrez API Key**: Used for PubMed literature searches
- **NSQIP API Key**: Used for NSQIP database access (simulated)
- **SEER API Key**: Used for SEER database access (simulated)

### Configuration Process

API keys are stored in the PostgreSQL database in the `settings` table. To configure the API keys:

1. Access the admin interface at `/admin`
2. Enter your API keys in the provided form
3. Click "Save" to store the keys in the database

Alternatively, you can use the SQL script in `backend/src/scripts/update_settings.sql` to directly insert the keys into the database.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express
- **Statistical Engine**: Python (Flask API for stats, uses SciPy and RPy2 for meta-analysis)
- **Database**: PostgreSQL
- **LLM**: OpenAI GPT-4 API
- **Voice Transcription**: OpenAI Whisper API
- **Literature Search**: PubMed via Entrez API, and simulated endpoints for NSQIP and SEER
- **Deployment**: Local Docker Compose setup

## Getting Started

1. Clone the repository
2. Run `docker-compose up -d` to start all services
3. Access the application at `http://localhost:3000`
4. Configure your API keys in the admin interface at `http://localhost:3000/admin`
