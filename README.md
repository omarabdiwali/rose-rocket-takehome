# ShipQuote Pro - Freight Quote Calculator

![Project Preview](https://i.imgur.com/NX26Rci.png)

ShipQuote Pro is a web application that helps users calculate real-time freight shipping quotes and track their quote history. Built with Next.js, it integrates Google Maps APIs for accurate location data and distance calculations.

### [Live Demo](https://rose-rocket-takehome.vercel.app/)

## Features

- **Instant Freight Quotes**: 
  - Calculate shipping costs instantly based on distance, equipment type, weight, and pickup date
  - Location autocomplete powered by Google Places API
  - Detailed cost breakdown including:
    - Base rate per kilometer
    - Equipment surcharges (Reefer/Flatbed/Dry Van)
    - Fuel surcharge percentage
    - Weight factor adjustments

- **Quote History**:
  - Persisted local storage of previous quotes
  - Advanced filtering by origin, destination, and equipment type
  - Paginated results for easy browsing
  - Detailed breakdown view of historical quotes
  - Quote deletion functionality

- **Modern UI**:
  - Responsive design with dark mode
  - Interactive cards with expandable details
  - Progress indicators and loading states
  - Error handling and validation

## Technologies Used

- **Frontend**:
  - Next.js (React Framework)
  - React Hooks (useState, useEffect)
  - Google Maps JavaScript API
  - Tailwind CSS (Styling)
  - Heroicons (Icon set)

- **Backend**:
  - Next.js API Routes
  - Google Distance Matrix API

- **Storage**:
  - Browser Local Storage (Quote persistence)

## Key Components

1. `pages/index.js` - Main application interface
2. `components/GoogleAutocomplete.js` - Google Places integration
3. `components/QuoteHistory.js` - Quote tracking and management
4. `pages/api/createQuote.js` - Quote calculation API endpoint
5. `components/utils.js` - Shared helper functions

## Installation

1. Clone the repository:
```bash
git clone https://github.com/omarabdiwali/rose-rocket-takehome.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_KEY=your_google_maps_api_key
```

4. Run the development server:
```bash
npm run dev
```

## Usage

1. Fill in the shipment details:
   - Origin and destination locations (autocomplete supported)
   - Equipment type (Dry Van, Reefer, or Flatbed)
   - Total weight in pounds
   - Pickup date

2. View the detailed cost breakdown showing:
   - Base rate calculation
   - Equipment surcharge (if applicable)
   - Fuel surcharge (varies by weight)
   - Weight factor (for loads over 10,000 lbs)
   - Total estimated cost

3. Access previous quotes in the History tab:
   - Search and filter by origin/destination
   - View detailed breakdowns of past quotes
   - Delete outdated quotes

## Google APIs Integration

The application uses two Google Maps APIs:
1. **Places API** - For location autocomplete functionality
2. **Distance Matrix API** - For calculating route distances

To enable these APIs:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Maps JavaScript API" and "Places API"
3. Generate an API key with proper restrictions

## Calculation Logic

The quote calculation uses the following formulas:
- **Base Rate**: $1.62/km × distance
- **Equipment Surcharge**:
  - Reefer: +30% of base rate
  - Flatbed: +15% of base rate
- **Fuel Surcharge using [Speedy](https://www.speedy.ca/fuel-surcharge)**:
  - <10,000 lbs (LTL): 23.7%
  - ≥10,000 lbs (TL): 55.7%
- **Weight Factor**: $0.10 per 100 lbs over 10,000 lbs

Distance calculation uses Google's Distance Matrix API with results cached in localStorage for improved performance.