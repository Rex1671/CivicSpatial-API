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

## 🌐 Live Demo & Testing

A live version of the API is deployed on Vercel for testing:
- **Test Endpoint**: [https://represetative.vercel.app/api/electoral?lat=19.0760&lon=72.8777](https://represetative.vercel.app/api/electoral?lat=19.0760&lon=72.8777)

## 📡 API Endpoints

The API is structured as independent serverless functions for scalability. Use the query parameters `lat` and `lon` for all endpoints.

### 🏙️ Jurisdiction
`/api/jurisdiction?lat={lat}&lon={lon}`
> Returns administrative state, district, and locality data enriched with Wikipedia insights.

<details>
<summary>View Sample Response</summary>

```json
{
  "success": true,
  "jurisdiction": {
    "state": "Maharashtra",
    "district_zila_parishad": "Mumbai Suburban district",
    "municipality_corporation": "Mumbai",
    "local_body_panchayat_ward": "L Ward",
    "city": "Mumbai",
    "locality": "Mumbai",
    "raw_country": "India"
  },
  "insights": {
    "title": "Mumbai",
    "description": "Capital of Maharashtra, India",
    "article_url": "https://en.wikipedia.org/wiki/Mumbai"
  }
}
```
</details>

### 🗳️ Electoral
`/api/electoral?lat={lat}&lon={lon}`
> Returns Parliamentary (MP) and Assembly (MLA) constituency details.

<details>
<summary>View Sample Response</summary>

```json
{
  "success": true,
  "representatives": {
    "mp": { "name": "Mumbai North Central", "state": "Maharashtra" },
    "mla": { "name": "Vile Parle", "no": 167, "state": "MAHARASHTRA" }
  }
}
```
</details>

### 👤 Representatives
`/api/representatives?lat={lat}&lon={lon}`
> Combines jurisdiction, electoral, and Wikipedia insights into a single profile.

<details>
<summary>View Sample Response</summary>

```json
{
  "success": true,
  "jurisdiction": { "state": "Maharashtra", "city": "Mumbai" },
  "representatives": {
    "mp": { "name": "Mumbai North Central" },
    "mla": { "name": "Vile Parle" }
  },
  "insights": { "title": "Mumbai", "article_url": "https://en.wikipedia.org/wiki/Mumbai" }
}
```
</details>

### 🏥 Infrastructure
`/api/infrastructure?lat={lat}&lon={lon}`
> Provides proximity data for highways, railways, and police stations.

<details>
<summary>View Sample Response</summary>

```json
{
  "success": true,
  "infrastructure": {
    "police_station": {
      "properties": { "ps": "PALGHAR", "district": "RAILWAY MUMBAI" },
      "distance_km": 0.01
    }
  }
}
```
</details>

### 🏘️ Wards
`/api/wards?lat={lat}&lon={lon}`
> Returns municipal or panchayat ward information.

<details>
<summary>View Sample Response</summary>

```json
{
  "success": true,
  "metro_data": {
    "Name": "L Ward",
    "Zone": "Zone 5",
    "City": "MUMBAI"
  }
}
```
</details>

## 📄 License
This project is licensed under the ISC License.

