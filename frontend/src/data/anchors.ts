// Delhi/NCR anchor locations and road networks for realistic mock data generation
// Based on actual Delhi geography and road networks

export const DELHI_ANCHORS = [
  // Central Delhi
  {
    id: 'minto-bridge',
    coordinates: { lat: 28.6280, lng: 77.2197 },
    area: 'Ring Road · Central Delhi',
    description: 'Major underpass on Ring Road prone to chronic flooding',
    roads: ['Ring Road', 'Minto Road', 'Vikas Marg'],
    keyIntersections: ['Lodhi Road', 'Purana Quila Road']
  },
  {
    id: 'pul-prahladpur',
    coordinates: { lat: 28.5097, lng: 77.2510 },
    area: 'Near Metro Station · South Delhi',
    description: 'Drainage bottleneck under metro station',
    roads: ['NH-48 (Mathura Road)', 'Mehrauli-Badarpur Road'],
    keyIntersections: ['Jasola Vihar', 'Chhatarpur']
  },
  {
    id: 'ring-road-who',
    coordinates: { lat: 28.5685, lng: 77.2510 },
    area: 'Near WHO HQ · New Delhi',
    description: 'Yearly monsoon flooding near WHO headquarters',
    roads: ['Ring Road', 'Dr. Radhakrishnan Sarani'],
    keyIntersections: ['Jantar Mantar Road', 'Sansad Marg']
  },
  {
    id: 'zakhira-flyover',
    coordinates: { lat: 28.6612, lng: 77.1534 },
    area: 'Paharganj · Central Delhi',
    description: 'Underpass flooding during heavy rain',
    roads: ['Paharganj Road', 'Connaught Place', 'Fatehpuri Road'],
    keyIntersections: ['Jantar Mantar Road', 'Chandni Chowk']
  },
  {
    id: 'loni-road',
    coordinates: { lat: 28.6945, lng: 77.2800 },
    area: 'East Delhi · Near UP Border',
    description: 'Poor drainage infrastructure, severe flooding',
    roads: ['Loni Road', 'NH-9 (Old Delhi-Ghaziabad Road)'],
    keyIntersections: ['Barat Lal Bahadur Shastri Marg', 'Rohini Phase 1']
  },
  {
    id: 'karala-kanjhawla',
    coordinates: { lat: 28.7350, lng: 77.0050 },
    area: 'Outer Delhi · Northwest',
    description: 'Chronic waterlogging during monsoon',
    roads: ['Kanjhawla Road', 'Outer Ring Road'],
    keyIntersections: ['Rohini', 'Narela', 'Bawana']
  },
  {
    id: 'yamuna-bank',
    coordinates: { lat: 28.6525, lng: 77.1650 },
    area: 'North Delhi · Along Yamuna River',
    description: 'Low-lying areas near river prone to backwater flooding',
    roads: ['Yamuna Bypass', 'Outer Ring Road', 'Grand Trunk Road'],
    keyIntersections: ['Pitampura', 'Shalimar Bagh', 'Narela']
  },
  {
    id: 'national-river',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    area: 'Delhi Center',
    description: 'Central Delhi location for map center',
    roads: ['Ring Road', 'Lodhi Road', 'Safdarjung Road'],
    keyIntersections: ['Khan Market', 'Safdarjung Enclave', 'Hauz Khas Village']
  },
  {
    id: 'national-river-north',
    coordinates: { lat: 28.6425, lng: 77.1725 },
    area: 'North Delhi',
    description: 'Areas north of Yamuna River',
    roads: ['Outer Ring Road', 'Grand Trunk Road', 'Dwarka Expressway'],
    keyIntersections: ['Pitampura', 'Narela', 'Bawana']
  },
  {
    id: 'national-river-south',
    coordinates: { lat: 28.5825, lng: 77.2025 },
    area: 'South Delhi',
    description: 'Areas south of Yamuna River',
    roads: ['Ring Road', 'Mehrauli-Badarpur Road', 'Satpula'],
    keyIntersections: ['Qutub Minar', 'Mehrauli', 'Govindpuri']
  },
  {
    id: 'national-river-east',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    area: 'East Delhi',
    description: 'Key area for east-side development',
    roads: ['Ring Road', 'East Ring Road', 'Old NH-24'],
    keyIntersections: ['Vasundhara Enclave', 'Scindia Vihar', 'Mohan Nagar']
  }
];

// Helper functions to work with anchor locations
export function getNearbyLocations(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5
): Array<{ id: string; coordinates: { lat: number; lng: number } }> {
  const nearby: Array<{ id: string; coordinates: { lat: number; lng: number } }> = [];

  for (const anchor of DELHI_ANCHORS) {
    const distance = Math.hypot(
      anchor.coordinates.lat - centerLat,
      anchor.coordinates.lng - centerLng
    );

    if (distance <= radiusKm) {
      nearby.push({
        id: anchor.id,
        coordinates: anchor.coordinates
      });
    }
  }

  return nearby;
}

export function getRoadNetworkNear(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Array<{ roadName: string; segmentLengthKm: number }> {
  const nearby: Array<{ roadName: string; segmentLengthKm: number }> = [];

  for (const anchor of DELHI_ANCHORS) {
    const distance = Math.hypot(
      anchor.coordinates.lat - lat,
      anchor.coordinates.lng - lng
    );

    if (distance <= radiusKm) {
      nearby.push({
        roadName: anchor.roads[0], // primary road
        segmentLengthKm: anchor.segment_length_km || 0.5
      });
    }
  }

  return nearby;
}