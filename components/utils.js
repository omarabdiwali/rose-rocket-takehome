// This file exports items that are used in different files, preventing duplicate code.
const options = {
  style: "currency",
  currency: "CAD"
}
export const currencyFormatter = new Intl.NumberFormat("en-CA", options);
export const numberFormatter = new Intl.NumberFormat("en-CA");
export const equipmentCharges = {
  "dry_van": "0%",
  "reefer": "30%",
  "flatbed": "15%"
}

/**
 * Calculates the fuel surcharge percentage, and returns it as a string.
 * @param {number} weight - The total weight of the truck.
 * @returns {string} The fuel charge percentage.
 */
export const getFuelSurchargePercent = (weight) => {
  if (weight < 10000) return "23.7%";
  else return "55.7%"
}