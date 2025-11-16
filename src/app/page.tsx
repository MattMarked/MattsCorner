export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🍽️ Matt's Corner
        </h1>
        <p className="text-xl text-center text-gray-600 mb-8">
          Dublin Food Map - Coming Soon!
        </p>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Interactive Dublin Restaurant Map
          </h2>
          <p className="text-gray-600 mb-4">
            Discover amazing restaurants and food spots around Dublin with an interactive map experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">🗺️ Interactive Map</h3>
              <p className="text-sm text-blue-600 mt-2">Explore locations with Google Maps integration</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">🏷️ Categories</h3>
              <p className="text-sm text-green-600 mt-2">Filter by cuisine type and dining style</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">✅ Progress Tracking</h3>
              <p className="text-sm text-purple-600 mt-2">Track visited vs. wishlist restaurants</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
