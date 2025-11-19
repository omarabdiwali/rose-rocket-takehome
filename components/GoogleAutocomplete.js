import { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";

const GoogleAutocomplete = ({ 
  onLoad, 
  onPlaceChanged, 
  placeholder,
  inputValue,
  setInputValue,
  inputClassName = "" 
}) => {
  const [autocomplete, setAutocomplete] = useState(null);

  /**
   * Handles when the `Autocomplete` component has loaded correctly, and sets the widget.
   * @param {google.maps.places.Autocomplete} autocomplete - Widget that provides Place predictions based on input.
   */
  const handleLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
    onLoad && onLoad(autocomplete);
  };

  /**
   * Handles when a Place from the predictions/suggestions is selected.
   */
  const handlePlaceChange = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      onPlaceChanged(place);
      setInputValue(place.formatted_address);
    }
  };

  return (
    // Loading Google's Autocomplete widget.
    <Autocomplete 
      onLoad={handleLoad} 
      onPlaceChanged={handlePlaceChange}
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-xl shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                   bg-slate-700 text-slate-50 placeholder-slate-500 transition duration-150 ease-in-out ${inputClassName}`}
      />
    </Autocomplete>
  );
};

export default GoogleAutocomplete;