/**
 * Gets the distance between two locations using the Google's Distance Matrix.
 * @param {string} origin - The origin of the trip.
 * @param {string} destination - The destination for the trip.
 * @returns {number | null} The distance between them in kms, or `null` if there is not a drivable route.
 */
const getDistance = async (origin, destination) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${destination}&origins=${origin}&units=metric&key=${process.env.NEXT_PUBLIC_API_KEY}`;
  return await fetch(url).then(res => res.json()).then(data => {
    // Checks if there is a valid route, returns null if there isn't.
    const status = data.rows[0].elements[0].status;
    if (status == "ZERO_RESULTS") return null;
    // API returns value in metres, change it to km, and return it.
    const metres = data.rows[0].elements[0].distance.value;
    const kms = metres / 1000;
    return kms;
  }).catch(err => console.error(err));
}

/**
 * Calculates the total rate of the trip, and returns the quote breakdown.
 * @param {number} distance - The distance between the origin and the destination.
 * @param {number} weight - The weight of the truck.
 * @param {string} equipmentType - The type of truck equipment.
 * @returns {Object} Total quote breakdown.
 */
const calculateTotal = (distance, weight, equipmentType) => {
  // Sets the constant values, avgKmRate was calculated based on the sample data's average base rate.
  // fuelSurchargePercent was based on https://www.speedy.ca/fuel-surcharge.
  const avgKmRate = 1.616;
  const fuelSurchargePercent = weight < 10000 ? 0.237 : 0.557;
  const multipliers = {
    "dry_van": 0,
    "reefer": 0.3,
    "flatbed": 0.15
  }

  // Breakdown of the different elements are calculated.
  const baseRate = avgKmRate * distance;
  const weightFactor = weight > 10000 ? ((weight - 10000) / 100) * 0.1 : 0;
  const equipmentCharge = baseRate * multipliers[equipmentType]
  const fuelSurcharge = (baseRate + equipmentCharge) * fuelSurchargePercent;

  // Returns the price breakdown, and the total amount.
  return {
    total: baseRate + equipmentCharge + fuelSurcharge + weightFactor,
    baseRate,
    weightFactor,
    fuelSurcharge,
    equipmentCharge,
  };
}

export default async function handler(req, res) {
  // Check that it is a POST method.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  // Verify that all the expected values exist.
  const { origin, destination, equipmentType, weight, pickupDate, cacheDistance } = req.body;
  if (!origin || !destination || !equipmentType || !weight || !pickupDate) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Calculate the distance if needed. If route is unavailable, return an error message.
    const distance = cacheDistance == null ? await getDistance(origin, destination) : parseFloat(cacheDistance);
    // The maximumDayTravel was calculated based on the sample data.
    const maximumDayTravel = 541;
    if (distance == null) {
      return res.status(400).json({ error: `No route between ${origin} and ${destination} available.` });
    }

    // Building the quote response, returning the form values with the breakdown of the costs, distance, and duration included.
    const quote = {
      origin,
      destination,
      equipmentType,
      weight,
      pickupDate,
      distance,
      days: distance == 0 ? 1 : Math.ceil(distance / maximumDayTravel),
      ...calculateTotal(distance, parseFloat(weight), equipmentType)
    }
    // Returns the quote object.
    return res.status(201).json({ quote });
  } catch (error) {
    // Returning an error message if a problem occurred, and logging it.
    console.error(error);
    return res.status(500).json({ error: 'Failed to create quote. Server returned an error.' });
  }
}