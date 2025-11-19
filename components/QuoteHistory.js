import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon, TruckIcon, FunnelIcon, ClockIcon, ScaleIcon,
  CalendarIcon, ArrowsRightLeftIcon, CalculatorIcon,
  CurrencyDollarIcon, ChevronDownIcon,
  ReceiptPercentIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { currencyFormatter, equipmentCharges, getFuelSurchargePercent, numberFormatter } from './utils';

/**
 * Helper component for styled card containers.
 * @returns {JSX.Element}
 */
const Card = ({ children, className = "", onClick }) => (
  <div
    className={`p-5 bg-slate-800 rounded-xl shadow-lg border border-slate-700 cursor-pointer 
                hover:border-indigo-500/50 hover:shadow-indigo-500/20 
                transition-all duration-300 ${className}`}
    onClick={onClick}
    aria-expanded={className.includes('bg-slate-700')}
  >
    {children}
  </div>
);

export default function QuoteHistory({ quotes, filters, setFilters, deleteQuote }) {
  // State to manage which quote is currently expanded.
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(quotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotes = quotes.slice(startIndex, endIndex);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage])

  /**
   * Formats the equipment type for better readability.
   * @param {string} type - The equipment type ('dry_van', 'reefer', 'flatbed', or an empty string).
   * @returns {string} The formatted type.
   */
  const formatEquipmentType = (type) => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Handles the changing of the filters, and in turn, the quotes.
   * @param {string} key - The key to change ('origin', 'destination', 'equipment').
   * @param {string} value - The value to change that key to.
   */
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  /**
   * Handles the visibility of the quotes.
   * @param {number} index - The index which signifies which quote to change.
   */
  const handleToggle = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  // Checks if there is no previous quotes.
  const isHistoryEmpty = quotes.length === 0 &&
    filters.origin.length === 0 &&
    filters.destination.length === 0 &&
    filters.equipment.length === 0;

  // Checks if there are no quotes that match the current filters.
  const isFilteredEmpty = quotes.length === 0 &&
    (filters.origin.length > 0 ||
      filters.destination.length > 0 ||
      filters.equipment.length !== "");

  // Returns info to the user if no previous quotes are found.
  if (isHistoryEmpty) return (
    <div className="text-center py-12 text-slate-600">
      <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>No quote history found yet.</p>
    </div>
  );

  /**
   * Helper component for the values of the quote breakdown.
   * @returns {JSX.Element}
   */
  const DetailItem = ({ icon: Icon, label, value, currency = true, unit = "" }) => (
    <div className="flex items-center text-sm text-slate-400">
      <Icon className="w-4 h-4 mr-2 text-indigo-400 flex-shrink-0" />
      <span className="font-medium text-slate-300 truncate mr-1">{label}:</span>
      <span className="font-mono text-indigo-200 whitespace-nowrap">
        {!currency ? `${numberFormatter.format(value.toFixed(0))} ${unit}` : currencyFormatter.format(value)}
      </span>
    </div>
  );

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 text-slate-50 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-indigo-500" />
        Quote History
      </h2>

      {/* Filtering Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        {/* Origin Filter */}
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="pl-10 border border-slate-600 rounded-xl px-4 py-2 w-full focus:ring-indigo-500 focus:border-transparent transition bg-slate-700 text-slate-50 placeholder-slate-500"
            placeholder="Search by origin"
            value={filters.origin}
            onChange={(e) => handleFilterChange('origin', e.target.value)}
          />
        </div>

        {/* Destination Filter */}
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="pl-10 border border-slate-600 rounded-xl px-4 py-2 w-full focus:ring-indigo-500 focus:border-transparent transition bg-slate-700 text-slate-50 placeholder-slate-500"
            placeholder="Search by destination"
            value={filters.destination}
            onChange={(e) => handleFilterChange('destination', e.target.value)}
          />
        </div>

        {/* Equipment Filter */}
        <div className="relative">
          <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            className="pl-10 pr-8 py-2 w-full md:w-60 border border-slate-600 rounded-xl focus:ring-indigo-500 focus:border-transparent bg-slate-700 text-slate-50 transition appearance-none"
            value={filters.equipment}
            onChange={(e) => handleFilterChange('equipment', e.target.value)}
          >
            <option value="">All Equipment</option>
            <option value="dry_van">Dry Van</option>
            <option value="reefer">Reefer</option>
            <option value="flatbed">Flatbed</option>
          </select>
        </div>
      </div>

      {/* Quote List & Pagination */}
      <div className="space-y-4">
        {/* Status Messages */}
        {isFilteredEmpty && (
          <p className="text-center py-6 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
            No quotes match your current filter criteria.
          </p>
        )}

        {/* Paginated Quotes */}
        {!isFilteredEmpty && currentQuotes.map((quote, index) => {
          index += startIndex;
          const isExpanded = index === expandedIndex;

          return (
            <Card
              key={index}
              className={isExpanded ? 'bg-slate-700 border-indigo-500' : ''}
              onClick={() => handleToggle(index)}
            >
              {/* MAIN CARD LAYOUT: Flex Col on Mobile, Row on Desktop */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-4">

                {/* Left Side: Route & Equipment */}
                <div className="flex items-start gap-4 w-full sm:w-auto">
                  <TruckIcon className="h-8 w-8 text-indigo-400 flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="min-w-0 flex-1"> {/* min-w-0 enables text truncation in flex children */}
                    <p className="text-sm font-medium text-slate-400 flex flex-wrap items-center gap-1">
                      <span className="text-slate-200 font-semibold break-words">{quote.origin}</span>
                      <span className="text-indigo-600 mx-1">→</span>
                      <span className="text-slate-200 font-semibold break-words">{quote.destination}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2 sm:mt-1">
                      <span className="inline-flex items-center px-3 py-1 font-medium rounded-full bg-indigo-900/50 text-indigo-300 whitespace-nowrap">
                        {formatEquipmentType(quote.equipmentType)}
                      </span>
                      <span className="flex items-center text-slate-400 whitespace-nowrap">
                        <ScaleIcon className="w-3.5 h-3.5 inline mr-1" />
                        {numberFormatter.format(quote.weight)} lbs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Price, Date, and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
                  
                  {/* Price & Date */}
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-extrabold text-green-400">
                      {currencyFormatter.format(quote.total)}
                    </p>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 sm:justify-end">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {quote.pickupDate}
                    </div>
                  </div>

                  {/* Action Buttons Container */}
                  <div className="flex items-center gap-3">
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const changePage = currentQuotes.length == 1;
                        deleteQuote(index);
                        if (index === expandedIndex) {
                          setExpandedIndex(null);
                        }
                        if (changePage) setCurrentPage(Math.max(1, currentPage - 1));
                      }}
                      className="text-rose-300 cursor-pointer hover:text-rose-500 transition-colors p-2 rounded-md hover:bg-rose-900/20"
                      title="Delete quote"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>

                    {/* Chevron Icon for Expansion */}
                    <ChevronDownIcon
                      className={`w-5 h-5 text-indigo-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Information (Conditionally Rendered) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                  <h3 className="text-lg font-semibold text-slate-200 col-span-1 sm:col-span-2 mb-2 border-b border-slate-700 pb-1">Rate Breakdown</h3>

                  <DetailItem
                    icon={ArrowsRightLeftIcon}
                    label="Distance"
                    currency={false}
                    value={quote.distance}
                    unit={"km"}
                  />
                  <DetailItem
                    icon={CalendarIcon}
                    label="Duration"
                    value={quote.days}
                    currency={false}
                    unit={quote.days == 1 ? "day" : "days"}
                  />
                  <DetailItem
                    icon={CurrencyDollarIcon}
                    label="Base Rate ($1.62/km)"
                    value={quote.baseRate}
                  />
                  <DetailItem
                    icon={ReceiptPercentIcon}
                    label={`Fuel Surcharge (${getFuelSurchargePercent(parseFloat(quote.weight))})`}
                    value={quote.fuelSurcharge}
                  />
                  <DetailItem
                    icon={TruckIcon}
                    label={`Equipment Charge (${equipmentCharges[quote.equipmentType]})`}
                    value={quote.equipmentCharge}
                  />
                  <DetailItem
                    icon={CalculatorIcon}
                    label="Weight Factor"
                    value={quote.weightFactor}
                  />

                </div>
              )}
            </Card>
          );
        })}
        {totalPages > 0 && (
          <div className="flex justify-between items-center mt-6 flex-wrap gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="cursor-pointer px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>

            {/* Hide Page Numbers on very small screens if crowded, otherwise flex wrap handles it */}
            <div className="flex gap-1 flex-wrap justify-center">
              {[...Array(totalPages).keys()].map(page => (
                <button
                  key={page + 1}
                  onClick={() => setCurrentPage(page + 1)}
                  className={`w-8 h-8 rounded-lg border text-sm ${currentPage === page + 1
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'bg-slate-800 cursor-pointer border-slate-700 hover:bg-slate-700'
                    }`}
                >
                  {page + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="cursor-pointer px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}