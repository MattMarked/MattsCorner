# 🍽️ Matt's Corner - Dublin Food Discovery Map

A beautiful, interactive web application for discovering and tracking Dublin restaurants, built with Next.js, TypeScript, and Tailwind CSS.

![Matt's Corner Screenshot](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

- 📊 **65 Dublin restaurants** parsed from markdown with smart categorization
- 🗺️ **Interactive map interface** (Google Maps integration ready)
- 🔍 **Advanced filtering** by category, status, and search
- 📱 **Responsive design** - works perfectly on all devices
- 📈 **Real-time statistics** - track your food journey (35% completion rate!)
- 🏷️ **8 cuisine categories** - Asian, Italian, Pizza, Bakery, and more
- ✅ **Progress tracking** - 23 visited, 42 to try
- 🔗 **External links** - Google Maps and Instagram integration
- 💾 **SQLite database** with full CRUD operations
- 🚀 **RESTful API** endpoints for all data operations

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite with better-sqlite3
- **Maps:** Google Maps API (configuration required)
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
   
   Add your Google Maps API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
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

## 🗺️ Google Maps Setup

1. **Get a Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API

2. **Configure API Key**
   - Add your API key to `.env.local`
   - Restrict the key to your domain for security

3. **The map will automatically load** with restaurant markers!

## 📊 Current Stats

- **Total Restaurants:** 65
- **Visited:** 23 (35% completion rate)
- **To Try:** 42
- **Categories:** 8
- **Data Source:** Markdown file with Google Maps URLs

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
│   │   ├── RestaurantMap.tsx
│   │   └── RestaurantFilters.tsx
│   ├── lib/               # Utilities and database
│   │   ├── database.ts    # SQLite operations
│   │   └── parser.ts      # Markdown parser
│   └── data/             # Data files
│       └── dublin-food.md # Restaurant data
├── database/             # SQLite database
└── public/              # Static assets
```

## 🔄 Data Management

The app automatically parses restaurant data from the markdown file, extracting:
- Restaurant names and descriptions
- Completion status (visited/to try)
- Categories (Asian, Italian, Pizza, etc.)
- Google Maps URLs
- Instagram links
- Hierarchical organization

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Import your GitHub repository in Vercel
   - It will auto-detect Next.js configuration

2. **Add environment variables**
   - Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel dashboard

3. **Deploy**
   - Vercel will automatically deploy on every push to main

The app is fully Vercel-optimized with:
- Automatic builds
- Edge functions for API routes
- Static optimization
- Global CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- [ ] Real Google Maps integration with custom markers
- [ ] Restaurant reviews and ratings
- [ ] Photo uploads
- [ ] Social sharing features
- [ ] Mobile app (React Native)
- [ ] Push notifications for new restaurants
- [ ] Advanced analytics dashboard

---

**Built with ❤️ by Matt** | [Live Demo](https://matts-corner.vercel.app) | [GitHub](https://github.com/MattMarked/MattsCorner)
