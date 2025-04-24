# ProductBoard to Supabase Connector

This utility syncs data from ProductBoard APIs to Supabase, populating the base tables in the schema:
- `productboard_initiatives`
- `productboard_features`
- `productboard_objectives`

## Features

- Fetches data from ProductBoard APIs with pagination
- Efficiently handles upserts (insert/update) to avoid duplicates
- Detailed logging and statistics of sync operations
- Command-line options for clearing tables before sync
- Provides detailed statistics about inserts vs updates

## Setup

### Prerequisites

- Node.js 14+
- Supabase project with the required schema
- ProductBoard API key with read access to Features, Initiatives, and Objectives

### Installation

1. Clone this repository
2. Install dependencies:

```bash
cd pb-connect
npm install
```

3. Create a `.env` file based on the example:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your credentials:

```
PRODUCTBOARD_API_KEY=your_api_key_here
PRODUCTBOARD_WORKSPACE_ID=your_workspace_id_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
```

## Usage

Run the sync with default options:

```bash
./run.sh
```

### Command Line Options

```
Usage: ./run.sh [options]

Options:
  -r, --reset              Clear all tables before syncing (prevents duplicates)
  --reset-tables TABLES    Clear specific tables, comma-separated
                           (e.g. 'productboard_features,productboard_initiatives')
  -w, --workspace ID       ProductBoard workspace ID
  -b, --board ID           ProductBoard board ID (defaults to 'default')
  -h, --help               Show this help message
```

### Handling Duplicates

If you encounter duplicates in your database, you have several options:

1. **Reset all tables before sync**:
   ```bash
   ./run.sh --reset
   ```
   This will clear all ProductBoard tables before syncing, ensuring a clean slate.

2. **Reset specific tables**:
   ```bash
   ./run.sh --reset-tables "productboard_features,productboard_initiatives"
   ```
   This only clears the specified tables.

3. **Normal Operation (Update Existing Records)**:
   ```bash
   ./run.sh
   ```
   The utility will detect existing records and update them rather than create duplicates.

## Project Structure

```
pb-connect/
├── lib/                   # Core functionality
│   ├── api.js            # ProductBoard API client
│   ├── db.js             # Supabase database operations
│   ├── sync.js           # Sync orchestration
│   └── transformer.js    # Data transformation
├── index.js              # Main entry point
├── run.sh                # Executable script
├── package.json          # Dependencies
├── .env.example          # Environment template
└── README.md             # Documentation
```

## How It Works

1. The sync process fetches data from three ProductBoard API endpoints:
   - `/features`
   - `/initiatives`
   - `/objectives`

2. For each record, the system:
   - Transforms the data to match the database schema
   - Adds workspace ID for multi-workspace support
   - Checks if a record with the same ProductBoard ID exists
   - Updates existing records or inserts new ones

3. The sync provides detailed statistics on:
   - Total records processed
   - New records inserted
   - Existing records updated

## Troubleshooting

- **Duplicate Records**: Use the `--reset` flag to clear tables before sync.
- **API Rate Limiting**: The tool implements pagination and request throttling to avoid API rate limits.
- **Missing Data**: Check your API key permissions in ProductBoard.
