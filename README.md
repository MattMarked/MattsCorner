# 🍽️ Matt's Corner - Dublin Food Discovery Map

A beautiful, interactive web application for discovering and tracking Dublin restaurants, built with Next.js, TypeScript, and Tailwind CSS.

![Matt's Corner Screenshot](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

- 📊 **65 Dublin restaurants** parsed from markdown with smart categorization
- 🗺️ **Interactive map interface** powered by Leaflet.js and OpenStreetMap
- 🔍 **Advanced filtering** by category, status, and search
- 📱 **Responsive design** - works perfectly on all devices
- 📈 **Real-time statistics** - track your food journey
- 🏷️ **Multiple cuisine categories** - Asian, Italian, Pizza, Bakery, and more
- ✅ **Progress tracking** - Visited vs To Try
- 🔗 **External links** - Google Maps and Instagram integration
- 💾 **SQLite database** with full CRUD operations
- 🚀 **RESTful API** endpoints for all data operations
- 🆓 **Zero-cost architecture** - No Google Maps API keys required

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite with better-sqlite3
- **Maps:** Leaflet.js with OpenStreetMap (Zero-cost)
- **Deployment:** Vercel-ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MattMarked/MattsCorner.git
   cd MattsCorner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your database:
   ```env
   DATABASE_URL=./database/restaurants.db
   ```

4. **Initialize the database**
   ```bash
   # The app will automatically create the database and populate it from markdown
   npm run dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📡 API Endpoints

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants?category=Asian` - Filter by category
- `GET /api/restaurants?status=completed` - Filter by status
- `GET /api/restaurants?search=pizza` - Search restaurants
- `POST /api/restaurants` - Refresh data from markdown or update status

### Categories
- `GET /api/categories` - Get all categories

### Statistics
- `GET /api/stats` - Get restaurant statistics

## 🗺️ Map Integration

This project uses **Leaflet.js** and **OpenStreetMap** for map visualization. 

### How it works:
1. Restaurant data is parsed from `src/data/dublin-food.md`.
2. Google Maps URLs are automatically resolved to extract latitude and longitude.
3. Coordinates are stored in the local SQLite database.
4. The map displays these locations as interactive markers.

**No API keys are required for the map functionality.**

## 📊 Data Source

The app automatically parses restaurant data from the markdown file (`src/data/dublin-food.md`), extracting:
- Restaurant names and descriptions
- Completion status (visited/to try)
- Categories (Asian, Italian, Pizza, etc.)
- Google Maps URLs
- Instagram links

## 🏗️ Project Structure

```
MattsCorner/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── RestaurantMap.tsx # Map wrapper (dynamic import)
│   │   ├── MapInner.tsx      # Leaflet implementation
│   │   └── RestaurantFilters.tsx
│   ├── lib/               # Utilities and database
│   │   ├── database.ts    # SQLite operations
│   │   ├── parser.ts      # Markdown parser
│   │   └── url-resolver.ts # URL to coordinate resolver
│   └── data/             # Data files
│       └── dublin-food.md # Restaurant data
├── database/             # SQLite database
└── public/              # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Import your GitHub repository in Vercel
   - It will auto-detect Next.js configuration

2. **Deploy**
   - Vercel will automatically deploy on every push to main

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Matt** | [Live Demo](https://matts-corner.vercel.app) | [GitHub](https://github.com/MattMarked/MattsCorner)
