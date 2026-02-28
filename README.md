# tonnon-kahvi

A coffee price tracker that collects and displays coffee prices from major Finnish grocery retailers. Find where to buy your coffee at the best price.

## Features

- Automated price fetching from Kesko (K-Group) and S-Group stores
- Price history tracking over time
- Latest price change notifications
- Web interface for browsing and comparing prices

## Architecture

The project runs as a set of Docker containers:

- **Fetcher** (Python) - Scrapes coffee prices from retailer APIs on a schedule
- **Backend** (Python / FastAPI) - REST API serving price data from the database
- **Frontend** (React Native / Expo Web) - Web UI for browsing prices, viewing history, and comparing deals
- **Database** (PostgreSQL 16) - Stores products and price history

## Tech Stack

- **Backend:** Python 3.11, FastAPI, psycopg2
- **Frontend:** React Native (Expo), TypeScript
- **Database:** PostgreSQL 16
- **Infrastructure:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Configuration

The `docker-compose.yml` file contains environment variables for store selection:

- `S_KAUPAT_STORE_ID` - S-Group store ID (find IDs from s-kaupat.fi store pages)

### Running

```bash
git clone https://github.com/rautitu/tonnon-kahvi.git
cd tonnon-kahvi
docker compose up -d
```

The services will start:
- Frontend: `http://localhost:49106`
- Backend API: `http://localhost:8000`
- Database: `localhost:5432`

### Deployment

Currently manual:

```bash
git pull
docker compose up -d --build
```

## API Endpoints

- `GET /coffee-prices` - Current coffee prices
- `GET /price-history` - Price history for a product
- `GET /latest-price-changes` - Recent price changes

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.
