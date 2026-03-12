# CivicSpatial API
> **Geographical intelligence API mapping GPS coordinates to jurisdictions, infrastructure, and elected representatives.**

CivicSpatial API is a sophisticated geographical intelligence and representation lookup service. It maps precise GPS coordinates to administrative jurisdictions, infrastructure data, and elected representatives (MPs, MLAs, and CMs).


## 🚀 Features

- **Jurisdiction Mapping**: Automatically identifies administrative boundaries (Wards, Constituencies, Districts) from latitude and longitude.
- **Representative Lookup**: Integrates official data to identify elected representatives for any given location.
- **Infrastructure Assessment**: Provides spatial insights into nearby infrastructure like highways and railways.
- **Geocoding & Reverse Geocoding**: Seamlessly converts addresses to coordinates and vice versa using high-performance spatial algorithms.
- **Vercel Ready**: Optimized for deployment as serverless functions.

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20.x recommended)
- **Framework**: Express.js
- **Spatial Processing**: [@turf/turf](https://turfjs.org/)
- **API Clients**: Axios
- **Deployment**: Vercel

## 📂 Project Structure

```text
├── api/                # Serverless function entry points
├── public/             # API Documentation & Frontend portal
├── services/           # Core spatial and geocoding logic
│   ├── geocoding.js    # Address lookup services
│   ├── spatial.js      # GIS geometry operations
│   └── wikipedia.js    # Enrichment data fetching
├── server.js           # Main Express application
└── package.json        # Dependencies and scripts
```

## ⚙️ Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/civic-spatial-api.git
   cd civic-spatial-api
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Data Configuration**
   > [!IMPORTANT]
   > The core spatial data (GeoJSON files for constituencies, wards, and infrastructure) is not included in this repository to ensure privacy and reduce size. 
   > 
   > To run the API locally, you must populate the `vercel_data/` directory with the required GeoJSON structures:
   > - `vercel_data/constituencies/`
   > - `vercel_data/infra/`
   > - `vercel_data/wards/`

4. **Run Locally**
   ```bash
   npm start
   ```

## 📡 API Usage

### Location Analysis
`GET /api/spatial?lat={latitude}&lon={longitude}`

Returns a comprehensive JSON object containing:
- State and District information
- Ward and Constituency details
- Elected representative names
- Nearby infrastructure proximity

## 📄 License

This project is licensed under the ISC License.
