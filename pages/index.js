import { useEffect, useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import GoogleAutocomplete from "../components/GoogleAutocomplete";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CheckCircleIcon,
  MapPinIcon,
  CircleStackIcon,
  ScaleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import QuoteHistory from "@/components/QuoteHistory";
import { currencyFormatter, equipmentCharges, getFuelSurchargePercent, numberFormatter } from "@/components/utils";

const libraries = ["places"];
const sortQuotes = (a, b) => {
  return new Date(a.pickupDate) - new Date(b.pickupDate);
}

// Helper component for styled card containers
const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

// Helper Component for Breakdown Row
const ItemRow = ({ label, value, title = "", isTotal = false, currency = true }) => (
  <div className={`flex justify-between items-center px-2 ${isTotal ? 'text-xl font-bold pt-2' : 'text-sm'}`}>
    <span title={title} className={`${isTotal ? 'text-slate-50' : 'text-slate-300'}`}>{label}</span>
    <span className={`${isTotal ? 'text-green-400' : 'text-slate-200'} ${currency && 'font-mono'}`}>
      {currency ? currencyFormatter.format(value) : value}
    </span>
  </div>
);

// Helper Component for Metric Box
const MetricBox = ({ title, value, unit, color }) => (
  <div className="flex flex-col items-start bg-slate-900 p-3 rounded-lg border border-slate-700 shadow-inner">
    <p className="text-xs font-medium text-slate-400">{title}</p>
    <p className={`text-2xl font-extrabold ${color} mt-1`}>
      {value ? value : "N/A"}
      <span className="text-sm font-semibold text-slate-500 ml-1">{unit}</span>
    </p>
  </div>
);


export default function HomePage() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipmentType, setEquipmentType] = useState("dry_van");
  const [weight, setWeight] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [quote, setQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [filters, setFilters] = useState({ origin: "", equipment: "", destination: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState('quote');
  const [originInputValue, setOriginInputValue] = useState("");
  const [destinationInputValue, setDestinationInputValue] = useState("");

  // Reads the previous quotes from local storage, runs once on load.
  useEffect(() => {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes == null) return;
    const translatedQuotes = JSON.parse(storedQuotes).sort(sortQuotes);
    setQuotes(translatedQuotes);
  }, []);

  /**
   * Deletes a quote based on their index, used in `<QuoteHistory />`.
   * @param {number} index - The index of the quote to delete.
   */
  const deleteQuote = (index) => {
    const savedQuotes = quotes.slice(0);
    savedQuotes.splice(index, 1);
    setQuotes(savedQuotes);
    localStorage.setItem('quotes', JSON.stringify(savedQuotes));
  }

  /**
   * Creates the quote using `api/createQuote`, updates local storage, and handles errors.
   */
  const handleCreateQuote = async () => {
    setErrorMessage("");

    // Verifies that the form values exist, and are valid.
    if (!origin || !destination || !equipmentType || !weight || !pickupDate) {
      setErrorMessage("Please fill in all required fields.");
      return;
    } else if (parseFloat(weight) <= 0) {
      setErrorMessage("Invalid weight value.");
      return;
    } else if (origin != originInputValue || destination != destinationInputValue) {
      setErrorMessage("Invalid locations, please select from dropdown.");
      return;
    }

    // Sets loading and quote values
    setLoading(true);
    setQuote(null);

    try {
      // Building and sending fetch request to the API.
      const weightInt = parseFloat(weight);
      const cacheDistance = localStorage.getItem(`${origin}-${destination}`);
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          equipmentType,
          weight: weightInt,
          pickupDate,
          cacheDistance
        })
      }
      const response = await fetch('/api/createQuote', options);

      // Handles if the response throws an error.
      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to create quote. Server returned an error.');
        return;
      }

      // Gets the quote data from the response, and adds the distance to local storage if the route is new.
      const data = await response.json();
      const distance = data.quote.distance;
      if (cacheDistance == null && distance) {
        localStorage.setItem(`${origin}-${destination}`, distance);
        localStorage.setItem(`${destination}-${origin}`, distance);
      }

      // Updates the current quote and the stored quotes, saves it to local storage.
      const updatedQuotes = [data.quote, ...quotes].sort(sortQuotes);
      localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
      setQuote(data.quote);
      setQuotes(updatedQuotes);
    } catch (error) {
      // Handles if an error is thrown when creating the quote.
      console.error("Quote creation error:", error);
      setErrorMessage(`Calculation failed: ${error.message || "An unknown error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtering the quotes based on the filters, used in <QuoteHistory />.
  const filteredQuotes = quotes.filter((quote) =>
    (filters.origin.length === 0 || (quote.origin && quote.origin.toLowerCase().includes(filters.origin.toLowerCase()))) &&
    (filters.destination.length === 0 || (quote.destination && quote.destination.toLowerCase().includes(filters.destination.toLowerCase()))) &&
    (filters.equipment.length === 0 || quote.equipmentType === filters.equipment)
  );

  /**
   * Handles changing the active tab.
   * @param {string} newTab - The tab to change it to ('quote' or 'history').
   */
  const changeActiveTab = (newTab) => {
    if (activeTab == newTab) return;
    setActiveTab(newTab);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header/Title Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-full shadow-lg shadow-indigo-500/50">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-50 tracking-tight">
                FreightQuote <span className="text-indigo-400">Pro</span>
              </h1>
              <p className="text-slate-400 text-sm">Calculate spot rates and track your history.</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-full text-slate-300 shadow-sm">
            {googleLoaded ? (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Maps Service Ready</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                <span>Loading Maps...</span>
              </>
            )}
          </div>
        </div>

        {/* Loads the script for access to Google's location autocomplete/suggestions, using the 'Places API'. */}
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_API_KEY}
          libraries={libraries}
          onLoad={() => setGoogleLoaded(true)}
        >
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-slate-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => changeActiveTab('quote')}
                  className={`group cursor-pointer inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'quote'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                    }`}
                >
                  <CurrencyDollarIcon className={`w-5 h-5 ${activeTab === 'quote' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>New Quote</span>
                </button>
                <button
                  onClick={() => changeActiveTab('history')}
                  className={`group cursor-pointer inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === 'history'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                    }`}
                >
                  <ClockIcon className={`w-5 h-5 ${activeTab === 'history' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>Quote History</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* "New Quote" Tab Content */}
            {activeTab === 'quote' && (
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-300">

                {/* LEFT COL: Quote Form */}
                <div className="lg:col-span-6 space-y-6">
                  <Card className="p-8">
                    <h2 className="text-xl font-bold mb-6 text-indigo-400 border-b border-slate-700 pb-3">Shipment Details</h2>

                    <form className="space-y-6">
                      {/* Origin */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Origin City</label>
                        <div className="relative">
                          <MapPinIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                          <GoogleAutocomplete
                            inputValue={originInputValue}
                            setInputValue={setOriginInputValue}
                            placeholder="e.g. Toronto, ON"
                            onPlaceChanged={(place) => setOrigin(place.formatted_address)}
                            inputClassName={!googleLoaded ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-700 text-slate-50 placeholder-slate-500 border-slate-600'}
                          />
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">Destination City</label>
                        <div className="relative">
                          <MapPinIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
                          <GoogleAutocomplete
                            inputValue={destinationInputValue}
                            setInputValue={setDestinationInputValue}
                            placeholder="e.g. Montreal, QC"
                            onPlaceChanged={(place) => setDestination(place.formatted_address)}
                            inputClassName={!googleLoaded ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-700 text-slate-50 placeholder-slate-500 border-slate-600'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Equipment Type */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-300">Equipment Type</label>
                          <div className="relative">
                            <TruckIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <select
                              value={equipmentType}
                              onChange={(e) => setEquipmentType(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-700 text-slate-50 transition"
                            >
                              <option value="dry_van">Dry Van (1.0x)</option>
                              <option value="reefer">Reefer (1.3x)</option>
                              <option value="flatbed">Flatbed (1.15x)</option>
                            </select>
                          </div>
                        </div>

                        {/* Weight */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-300">Total Weight (lbs)</label>
                          <div className="relative">
                            <ScaleIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="number"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              min={1}
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-700 text-slate-50 transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pickup Date */}
                      <div className="space-y-2">
                        <label htmlFor="pickup-date" className="block text-sm font-medium text-slate-300">
                          Pickup Date
                        </label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                          <input
                            id="pickup-date"
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-700 text-slate-50 transition"
                          />
                        </div>
                      </div>
                    </form>

                    {/* Submit Button */}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleCreateQuote}
                        disabled={loading || !googleLoaded}
                        className="w-full cursor-pointer px-6 py-3 border border-transparent text-base font-semibold rounded-xl 
                            disabled:opacity-60 disabled:cursor-not-allowed bg-indigo-600 text-white 
                            hover:bg-indigo-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 shadow-md shadow-indigo-500/30"
                      >
                        {loading ? (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <CurrencyDollarIcon className="h-5 w-5" />
                        )}
                        {loading ? 'Calculating...' : 'Calculate Quote'}
                      </button>
                    </div>
                  </Card>
                </div>

                {/* RIGHT COL: Quote Result */}
                <div className="lg:col-span-6">
                  {/* Error Message Display */}
                  {errorMessage && (
                    <div className="mb-5 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-sm transition animate-in fade-in">
                      {errorMessage}
                    </div>
                  )}
                  {/* Loading state for the result card */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400 p-8">
                      <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-lg font-semibold mt-4">Generating Quote...</p>
                    </div>
                  )}

                  {/* Quote Result Card - Detailed Breakdown */}
                  {!loading && quote && (
                    <Card className="p-6 bg-indigo-900/50 border-indigo-700 animate-in fade-in duration-500">
                      <h2 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        Quote Breakdown
                      </h2>

                      {/* Cost Breakdown */}
                      <div className="space-y-3 mb-5">
                        <ItemRow label="Origin" value={quote.origin} currency={false} />
                        <ItemRow label="Destination" value={quote.destination} currency={false} />
                        <div className="h-px bg-slate-700 mx-auto w-full my-2" />
                        <ItemRow title="$1.62/km" label="Base Rate ($1.62/km)" value={quote.baseRate} />
                        {quote.equipmentCharge !== 0 && 
                        <ItemRow
                          title={`${equipmentCharges[quote.equipmentType]}`}
                          label={`Equipment Charge (${equipmentCharges[quote.equipmentType]})`}
                          value={quote.equipmentCharge} 
                        />}
                        <ItemRow 
                          title={getFuelSurchargePercent(parseFloat(quote.weight))}
                          label={`Fuel Surcharge (${getFuelSurchargePercent(parseFloat(quote.weight))})`}
                          value={quote.fuelSurcharge} 
                        />
                        {quote.weightFactor !== 0 && 
                        <ItemRow title="$0.10 per 100lbs over 10,000lbs" 
                          label="Weight Factor" 
                          value={quote.weightFactor}
                        />}
                        <ItemRow label="Final Total Rate" value={quote.total} isTotal={true} />
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                        <MetricBox
                          title="Estimated Distance"
                          value={numberFormatter.format(quote.distance.toFixed(0))}
                          unit="km"
                          color="text-indigo-400"
                        />
                        <MetricBox
                          title="Estimated Duration"
                          value={quote.days}
                          unit={quote.days == 1 ? "day" : "days"}
                          color={"text-indigo-400"}
                        />
                      </div>

                      <div className="col-span-2 text-sm pt-4 text-slate-400 flex items-center gap-2 border-t border-slate-700 mt-4">
                        <CircleStackIcon className="w-5 h-5 text-indigo-500" />
                        Quote saved to history.
                      </div>
                    </Card>
                  )}

                  {/* Placeholder for when no quote is generated yet */}
                  {!loading && !quote && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700 text-slate-600 p-8">
                      <CurrencyDollarIcon className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-semibold">Your quote will appear here.</p>
                      <p className="text-sm">Fill out the form to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* "Quote History" Tab Content */}
            {activeTab === 'history' && (
              <div className="animate-in fade-in duration-300">
                <QuoteHistory
                  quotes={filteredQuotes}
                  filters={filters}
                  setFilters={setFilters}
                  deleteQuote={deleteQuote}
                />
              </div>
            )}
          </div>
        </LoadScript>
      </div>
    </div>
  );
}