import { Location } from '../types';

export interface LandmarkLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  category: 'Airport' | 'Tech Park' | 'Metro/Station' | 'Commercial' | 'Tourist/Landmark' | 'Residential';
  loc: Location;
}

export const INDIAN_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Goa',
  'Kochi',
  'Chandigarh'
] as const;

export type IndianCity = (typeof INDIAN_CITIES)[number];

export const CITY_CENTERS: Record<IndianCity, { lat: number; lng: number; zoom: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Mumbai: { lat: 19.076, lng: 72.8777, zoom: 12 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209, zoom: 12 },
  Hyderabad: { lat: 17.385, lng: 78.4867, zoom: 12 },
  Chennai: { lat: 13.0827, lng: 80.2707, zoom: 12 },
  Kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
  Pune: { lat: 18.5204, lng: 73.8567, zoom: 12 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, zoom: 12 },
  Jaipur: { lat: 26.9124, lng: 75.7873, zoom: 12 },
  Goa: { lat: 15.4989, lng: 73.8278, zoom: 11 },
  Kochi: { lat: 9.9312, lng: 76.2673, zoom: 12 },
  Chandigarh: { lat: 30.7333, lng: 76.7794, zoom: 12 }
};

export const ALL_INDIA_LANDMARKS: LandmarkLocation[] = [
  // --- BENGALURU ---
  {
    id: 'blr-1',
    name: 'Indiranagar 100ft Rd',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Commercial',
    loc: { latitude: 12.9784, longitude: 77.6408, address: 'Indiranagar 100ft Road, Bengaluru, Karnataka' }
  },
  {
    id: 'blr-2',
    name: 'Koramangala 5th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Commercial',
    loc: { latitude: 12.9352, longitude: 77.6245, address: 'Koramangala 5th Block, Bengaluru, Karnataka' }
  },
  {
    id: 'blr-3',
    name: 'MG Road Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Metro/Station',
    loc: { latitude: 12.9756, longitude: 77.6066, address: 'MG Road CBD, Bengaluru, Karnataka' }
  },
  {
    id: 'blr-4',
    name: 'Whitefield ITPL Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Tech Park',
    loc: { latitude: 12.9698, longitude: 77.7499, address: 'ITPB Whitefield, Bengaluru, Karnataka' }
  },
  {
    id: 'blr-5',
    name: 'Kempegowda Int. Airport (BLR)',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Airport',
    loc: { latitude: 13.1986, longitude: 77.7066, address: 'BLR Airport Terminal 1, Devanahalli, Bengaluru' }
  },
  {
    id: 'blr-6',
    name: 'Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    category: 'Tech Park',
    loc: { latitude: 12.8452, longitude: 77.6602, address: 'Electronic City Phase 1, Hosur Rd, Bengaluru' }
  },

  // --- MUMBAI ---
  {
    id: 'bom-1',
    name: 'Bandra Kurla Complex (BKC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Commercial',
    loc: { latitude: 19.0657, longitude: 72.8687, address: 'BKC Financial District, Bandra East, Mumbai' }
  },
  {
    id: 'bom-2',
    name: 'CSM International Airport (BOM)',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Airport',
    loc: { latitude: 19.0896, longitude: 72.8656, address: 'Chhatrapati Shivaji Maharaj Airport T2, Mumbai' }
  },
  {
    id: 'bom-3',
    name: 'Nariman Point & Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Tourist/Landmark',
    loc: { latitude: 18.9256, longitude: 72.8242, address: 'Nariman Point, Marine Drive Promenade, Mumbai' }
  },
  {
    id: 'bom-4',
    name: 'Juhu Beach & Tara Rd',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Tourist/Landmark',
    loc: { latitude: 19.0988, longitude: 72.8264, address: 'Juhu Tara Road, Vile Parle West, Mumbai' }
  },
  {
    id: 'bom-5',
    name: 'Andheri West Lokhandwala',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Commercial',
    loc: { latitude: 19.1308, longitude: 72.8285, address: 'Lokhandwala Complex, Andheri West, Mumbai' }
  },
  {
    id: 'bom-6',
    name: 'Powai Hiranandani Gardens',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Residential',
    loc: { latitude: 19.1197, longitude: 72.9056, address: 'Hiranandani Gardens, Powai Lake, Mumbai' }
  },

  // --- DELHI NCR ---
  {
    id: 'del-1',
    name: 'Connaught Place (CP Circle)',
    city: 'Delhi NCR',
    state: 'Delhi',
    category: 'Commercial',
    loc: { latitude: 28.6315, longitude: 77.2167, address: 'Inner Circle, Connaught Place, New Delhi' }
  },
  {
    id: 'del-2',
    name: 'Cyber City & Cyber Hub Gurgaon',
    city: 'Delhi NCR',
    state: 'Haryana',
    category: 'Tech Park',
    loc: { latitude: 28.4952, longitude: 77.0895, address: 'DLF Cyber City, Sector 24, Gurugram, NCR' }
  },
  {
    id: 'del-3',
    name: 'IGI Airport Terminal 3 (DEL)',
    city: 'Delhi NCR',
    state: 'Delhi',
    category: 'Airport',
    loc: { latitude: 28.5562, longitude: 77.1000, address: 'Indira Gandhi International Airport T3, New Delhi' }
  },
  {
    id: 'del-4',
    name: 'India Gate & Central Vista',
    city: 'Delhi NCR',
    state: 'Delhi',
    category: 'Tourist/Landmark',
    loc: { latitude: 28.6129, longitude: 77.2295, address: 'Rajpath, India Gate Circle, New Delhi' }
  },
  {
    id: 'del-5',
    name: 'Noida Sector 62 IT Hub',
    city: 'Delhi NCR',
    state: 'Uttar Pradesh',
    category: 'Tech Park',
    loc: { latitude: 28.6271, longitude: 77.3621, address: 'Sector 62 Electronic City, Noida, NCR' }
  },
  {
    id: 'del-6',
    name: 'Hauz Khas Village & Market',
    city: 'Delhi NCR',
    state: 'Delhi',
    category: 'Commercial',
    loc: { latitude: 28.5494, longitude: 77.1932, address: 'Hauz Khas Village, South Delhi, New Delhi' }
  },

  // --- HYDERABAD ---
  {
    id: 'hyd-1',
    name: 'HITEC City Cyber Towers',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Tech Park',
    loc: { latitude: 17.4504, longitude: 78.3808, address: 'Cyber Towers, HITEC City, Madhapur, Hyderabad' }
  },
  {
    id: 'hyd-2',
    name: 'Jubilee Hills Road 36',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Commercial',
    loc: { latitude: 17.4325, longitude: 78.4071, address: 'Road No. 36, Jubilee Hills, Hyderabad' }
  },
  {
    id: 'hyd-3',
    name: 'Gachibowli Financial District',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Tech Park',
    loc: { latitude: 17.4156, longitude: 78.3427, address: 'Financial District, Gachibowli, Hyderabad' }
  },
  {
    id: 'hyd-4',
    name: 'Rajiv Gandhi Int. Airport (HYD)',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Airport',
    loc: { latitude: 17.2403, longitude: 78.4294, address: 'Shamshabad, Hyderabad International Airport' }
  },
  {
    id: 'hyd-5',
    name: 'Charminar & Old City',
    city: 'Hyderabad',
    state: 'Telangana',
    category: 'Tourist/Landmark',
    loc: { latitude: 17.3616, longitude: 78.4747, address: 'Charminar Heritage Plaza, Old City, Hyderabad' }
  },

  // --- CHENNAI ---
  {
    id: 'maa-1',
    name: 'T. Nagar Panagal Park',
    city: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Commercial',
    loc: { latitude: 13.0418, longitude: 80.2341, address: 'T. Nagar Shopping Hub, Chennai, Tamil Nadu' }
  },
  {
    id: 'maa-2',
    name: 'OMR IT Expressway Thoraipakkam',
    city: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Tech Park',
    loc: { latitude: 12.9432, longitude: 80.2374, address: 'Rajiv Gandhi Salai, OMR IT Corridor, Chennai' }
  },
  {
    id: 'maa-3',
    name: 'Marina Beach & Santhome',
    city: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Tourist/Landmark',
    loc: { latitude: 13.0499, longitude: 80.2824, address: 'Kamarajar Promenade, Marina Beach, Chennai' }
  },
  {
    id: 'maa-4',
    name: 'Chennai Int. Airport (MAA)',
    city: 'Chennai',
    state: 'Tamil Nadu',
    category: 'Airport',
    loc: { latitude: 12.9941, longitude: 80.1709, address: 'Meenambakkam Airport, GST Road, Chennai' }
  },

  // --- KOLKATA ---
  {
    id: 'ccu-1',
    name: 'Park Street CBD',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Commercial',
    loc: { latitude: 22.5517, longitude: 88.3524, address: 'Park Street Dining & Heritage Boulevard, Kolkata' }
  },
  {
    id: 'ccu-2',
    name: 'Salt Lake Sector V IT Hub',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Tech Park',
    loc: { latitude: 22.5804, longitude: 88.4378, address: 'Sector V Electronic Complex, Bidhannagar, Kolkata' }
  },
  {
    id: 'ccu-3',
    name: 'Howrah Railway Terminus',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Metro/Station',
    loc: { latitude: 22.5892, longitude: 88.3426, address: 'Howrah Station & Bridge, Howrah, West Bengal' }
  },
  {
    id: 'ccu-4',
    name: 'Netaji Subhash Airport (CCU)',
    city: 'Kolkata',
    state: 'West Bengal',
    category: 'Airport',
    loc: { latitude: 22.6547, longitude: 88.4467, address: 'Dum Dum Airport T2, Kolkata, West Bengal' }
  },

  // --- PUNE ---
  {
    id: 'pnq-1',
    name: 'Hinjewadi Infotech Park Phase 1',
    city: 'Pune',
    state: 'Maharashtra',
    category: 'Tech Park',
    loc: { latitude: 18.5913, longitude: 73.7389, address: 'Rajiv Gandhi Infotech Park, Hinjewadi, Pune' }
  },
  {
    id: 'pnq-2',
    name: 'Koregaon Park & North Main Rd',
    city: 'Pune',
    state: 'Maharashtra',
    category: 'Commercial',
    loc: { latitude: 18.5362, longitude: 73.8940, address: 'North Main Road, Koregaon Park, Pune' }
  },
  {
    id: 'pnq-3',
    name: 'Pune Airport (PNQ) Lohegaon',
    city: 'Pune',
    state: 'Maharashtra',
    category: 'Airport',
    loc: { latitude: 18.5822, longitude: 73.9197, address: 'Lohegaon Airport, New Airport Rd, Pune' }
  },

  // --- AHMEDABAD ---
  {
    id: 'amd-1',
    name: 'SG Highway & Prahlad Nagar',
    city: 'Ahmedabad',
    state: 'Gujarat',
    category: 'Commercial',
    loc: { latitude: 23.0125, longitude: 72.5118, address: 'Sarkhej - Gandhinagar Highway, Ahmedabad' }
  },
  {
    id: 'amd-2',
    name: 'Sardar Vallabhbhai Airport (AMD)',
    city: 'Ahmedabad',
    state: 'Gujarat',
    category: 'Airport',
    loc: { latitude: 23.0734, longitude: 72.6347, address: 'Hansol, Ahmedabad International Airport, Gujarat' }
  },

  // --- JAIPUR ---
  {
    id: 'jai-1',
    name: 'C-Scheme & MI Road',
    city: 'Jaipur',
    state: 'Rajasthan',
    category: 'Commercial',
    loc: { latitude: 26.9118, longitude: 75.8016, address: 'Mirza Ismail Road, C-Scheme, Jaipur' }
  },
  {
    id: 'jai-2',
    name: 'Jaipur Int. Airport (JAI) Sanganer',
    city: 'Jaipur',
    state: 'Rajasthan',
    category: 'Airport',
    loc: { latitude: 26.8289, longitude: 75.8056, address: 'Airport Rd, Sanganer, Jaipur, Rajasthan' }
  },

  // --- GOA ---
  {
    id: 'goa-1',
    name: 'Panaji Church & Fontainhas',
    city: 'Goa',
    state: 'Goa',
    category: 'Tourist/Landmark',
    loc: { latitude: 15.4989, longitude: 73.8278, address: 'Immaculate Conception Church, Panaji, Goa' }
  },
  {
    id: 'goa-2',
    name: 'Calangute & Baga Beach Circle',
    city: 'Goa',
    state: 'Goa',
    category: 'Tourist/Landmark',
    loc: { latitude: 15.5439, longitude: 73.7553, address: 'Calangute - Baga Beach Strip, North Goa' }
  },
  {
    id: 'goa-3',
    name: 'Dabolim Int. Airport (GOI)',
    city: 'Goa',
    state: 'Goa',
    category: 'Airport',
    loc: { latitude: 15.3808, longitude: 73.8314, address: 'Dabolim Airport Terminal, South Goa' }
  },

  // --- KOCHI ---
  {
    id: 'cok-1',
    name: 'Marine Drive & MG Road Kochi',
    city: 'Kochi',
    state: 'Kerala',
    category: 'Commercial',
    loc: { latitude: 9.9796, longitude: 76.2764, address: 'Marine Drive Promenade, Ernakulam, Kochi' }
  },
  {
    id: 'cok-2',
    name: 'Cochin Int. Airport (COK) Nedumbassery',
    city: 'Kochi',
    state: 'Kerala',
    category: 'Airport',
    loc: { latitude: 10.1556, longitude: 76.3905, address: 'CIAL Airport Terminal 3, Nedumbassery, Kochi' }
  },

  // --- CHANDIGARH ---
  {
    id: 'ixc-1',
    name: 'Sector 17 Commercial Plaza',
    city: 'Chandigarh',
    state: 'Punjab/Haryana',
    category: 'Commercial',
    loc: { latitude: 30.7398, longitude: 76.7827, address: 'Sector 17 City Centre Plaza, Chandigarh' }
  },
  {
    id: 'ixc-2',
    name: 'Chandigarh Int. Airport (IXC) Mohali',
    city: 'Chandigarh',
    state: 'Punjab',
    category: 'Airport',
    loc: { latitude: 30.6735, longitude: 76.7885, address: 'New Civil Air Terminal, Jheurheri, Mohali' }
  }
];

export function getLandmarksByCity(city: IndianCity | 'All India'): LandmarkLocation[] {
  if (city === 'All India') return ALL_INDIA_LANDMARKS;
  return ALL_INDIA_LANDMARKS.filter((l) => l.city === city);
}

export function searchIndiaLocations(query: string, cityFilter?: IndianCity | 'All India'): LandmarkLocation[] {
  const q = query.trim().toLowerCase();
  const pool = cityFilter && cityFilter !== 'All India' ? getLandmarksByCity(cityFilter) : ALL_INDIA_LANDMARKS;
  if (!q) return pool;
  return pool.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      (l.loc.address || '').toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
  );
}
