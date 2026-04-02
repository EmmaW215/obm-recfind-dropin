import axios from "axios";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";

// ============================================================================
// Mock Data - Used when backend is not available
// Note: In production, the backend scraper fetches REAL data from city websites
// These mock data use activity DETAIL page URLs (not general calendar pages)
// ============================================================================

// Helper to get date strings for today, tomorrow, day after tomorrow
const getDateString = (daysFromToday: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0];
};

// Activity detail URL builders (these are the REAL URL patterns from each city)
const buildDetailUrl = {
  // Mississauga ActiveNet: /activity/search/detail/{activity_id}
  mississauga: (activityId: string) =>
    `https://anc.ca.apm.activecommunities.com/activemississauga/activity/search/detail/${activityId}?onlineSiteId=0&from_original_cui=true`,
  // Oakville PerfectMind: /BookMe4BookingPages/ClassDetails?classId={class_id}
  oakville: (classId: string) =>
    `https://townofoakville.perfectmind.com/24974/Clients/BookMe4BookingPages/ClassDetails?classId=${classId}&widgetId=acf798a6-9321-41b7-aa41-92cbb8c1b485`,
  // Burlington: links to specific activity pages
  burlington: (activityId: string) =>
    `https://econnect.burlington.ca/Start/Start.asp?ActivityID=${activityId}`,
};

// Generate mock programs with REAL dates (today + 2 days) and DETAIL page URLs
const generateMockPrograms = () => {
  const today = getDateString(0);
  const tomorrow = getDateString(1);
  const dayAfter = getDateString(2);

  return [
    // === OAKVILLE Programs ===
    {
      id: "oak_class_12345",
      name: "Adult Lane Swim",
      location_id: "qepccc",
      location_name: "Queen Elizabeth Park CC",
      city: "oakville",
      activity_type: "swim",
      age_group: "adult",
      date: today,
      start_time: "06:30",
      end_time: "08:00",
      fee: 5.5,
      spots_available: 8,
      spots_total: 12,
      registration_url: buildDetailUrl.oakville("12345"),
    },
    {
      id: "oak_class_12346",
      name: "Fitness Drop-In",
      location_id: "glen_abbey",
      location_name: "Glen Abbey Community Centre",
      city: "oakville",
      activity_type: "fitness",
      age_group: "adult",
      date: today,
      start_time: "09:00",
      end_time: "10:30",
      fee: 6.0,
      spots_available: 15,
      spots_total: 25,
      registration_url: buildDetailUrl.oakville("12346"),
    },
    {
      id: "oak_class_12347",
      name: "Public Skate",
      location_id: "sixteen_mile",
      location_name: "Sixteen Mile Sports Complex",
      city: "oakville",
      activity_type: "skating",
      age_group: "family",
      date: tomorrow,
      start_time: "14:00",
      end_time: "15:30",
      fee: 4.0,
      spots_available: 50,
      spots_total: 100,
      registration_url: buildDetailUrl.oakville("12347"),
    },
    {
      id: "oak_class_12348",
      name: "Senior Pickleball",
      location_id: "iroquois_ridge",
      location_name: "Iroquois Ridge Community Centre",
      city: "oakville",
      activity_type: "sports",
      age_group: "senior",
      date: dayAfter,
      start_time: "10:00",
      end_time: "12:00",
      fee: 5.0,
      spots_available: 20,
      spots_total: 24,
      registration_url: buildDetailUrl.oakville("12348"),
    },

    // === BURLINGTON Programs ===
    {
      id: "burl_act_98765",
      name: "Aquafit",
      location_id: "tansley_woods",
      location_name: "Tansley Woods CC",
      city: "burlington",
      activity_type: "swim",
      age_group: "adult",
      date: today,
      start_time: "10:00",
      end_time: "11:00",
      fee: 6.5,
      spots_available: 10,
      spots_total: 20,
      registration_url: buildDetailUrl.burlington("98765"),
    },
    {
      id: "burl_act_98766",
      name: "Adult Shinny Hockey",
      location_id: "central_arena",
      location_name: "Central Arena",
      city: "burlington",
      activity_type: "skating",
      age_group: "adult",
      date: today,
      start_time: "12:00",
      end_time: "13:30",
      fee: 8.0,
      spots_available: 18,
      spots_total: 24,
      registration_url: buildDetailUrl.burlington("98766"),
    },
    {
      id: "burl_act_98767",
      name: "Family Swim",
      location_id: "angela_coughlan",
      location_name: "Angela Coughlan Pool",
      city: "burlington",
      activity_type: "swim",
      age_group: "family",
      date: tomorrow,
      start_time: "15:00",
      end_time: "17:00",
      fee: 4.0,
      spots_available: 30,
      spots_total: 50,
      registration_url: buildDetailUrl.burlington("98767"),
    },
    {
      id: "burl_act_98768",
      name: "Drop-In Badminton",
      location_id: "brant_hills",
      location_name: "Brant Hills CC",
      city: "burlington",
      activity_type: "sports",
      age_group: "adult",
      date: dayAfter,
      start_time: "19:00",
      end_time: "21:00",
      fee: 5.0,
      spots_available: 12,
      spots_total: 16,
      registration_url: buildDetailUrl.burlington("98768"),
    },

    // === MISSISSAUGA Programs ===
    {
      id: "miss_122723",
      name: "Adult Leisure Swim",
      location_id: "meadowvale",
      location_name: "Meadowvale CC",
      city: "mississauga",
      activity_type: "swim",
      age_group: "adult",
      date: today,
      start_time: "07:00",
      end_time: "09:25",
      fee: 5.0,
      spots_available: 15,
      spots_total: 25,
      registration_url: buildDetailUrl.mississauga("122723"),
    },
    {
      id: "miss_122724",
      name: "Drop-In Yoga",
      location_id: "churchill_meadows",
      location_name: "Churchill Meadows CC",
      city: "mississauga",
      activity_type: "fitness",
      age_group: "adult",
      date: today,
      start_time: "18:00",
      end_time: "19:00",
      fee: 8.0,
      spots_available: 12,
      spots_total: 20,
      registration_url: buildDetailUrl.mississauga("122724"),
    },
    {
      id: "miss_122725",
      name: "Youth Basketball",
      location_id: "huron_park",
      location_name: "Huron Park CC",
      city: "mississauga",
      activity_type: "sports",
      age_group: "youth",
      date: tomorrow,
      start_time: "16:00",
      end_time: "18:00",
      fee: 4.0,
      spots_available: 20,
      spots_total: 30,
      registration_url: buildDetailUrl.mississauga("122725"),
    },
    {
      id: "miss_122726",
      name: "Public Skate",
      location_id: "iceland",
      location_name: "Iceland Mississauga",
      city: "mississauga",
      activity_type: "skating",
      age_group: "family",
      date: dayAfter,
      start_time: "13:00",
      end_time: "15:00",
      fee: 5.0,
      spots_available: 80,
      spots_total: 150,
      registration_url: buildDetailUrl.mississauga("122726"),
    },
  ];
};

// Generate mock programs with real dates
const MOCK_PROGRAMS = generateMockPrograms();

const MOCK_LOCATIONS: Record<string, Array<{ id: string; name: string }>> = {
  oakville: [
    // Community Centres
    { id: "iroquois_ridge", name: "Iroquois Ridge Community Centre" },
    { id: "glen_abbey", name: "Glen Abbey Community Centre" },
    { id: "sixteen_mile", name: "Sixteen Mile Sports Complex" },
    { id: "trafalgar", name: "Oakville Trafalgar Community Centre" },
    { id: "qepccc", name: "Queen Elizabeth Park Community & Cultural Centre" },
    { id: "river_oaks", name: "River Oaks Community Centre" },
    // Libraries
    { id: "oakville_central_library", name: "Central Branch Library (QEPCCC)" },
    { id: "glen_abbey_library", name: "Glen Abbey Library" },
    { id: "iroquois_ridge_library", name: "Iroquois Ridge Library" },
    { id: "white_oaks_library", name: "White Oaks Library" },
    // Arenas
    { id: "iroquois_ridge_arena", name: "Iroquois Ridge Arena" },
    { id: "glen_abbey_arena", name: "Glen Abbey Arena" },
    { id: "sixteen_mile_arena", name: "Sixteen Mile Sports Complex Arenas" },
    { id: "oakville_arena", name: "Oakville Arena" },
    { id: "river_oaks_arena", name: "River Oaks Arena" },
    { id: "joshuas_creek_arena", name: "Joshua's Creek Arenas" },
  ],
  burlington: [
    // Community Centres
    { id: "aldershot", name: "Aldershot Community Centre" },
    { id: "seniors_centre", name: "Burlington Seniors' Centre" },
    { id: "central_arena", name: "Central Arena & Community Centre" },
    { id: "haber", name: "Haber Recreation Centre" },
    { id: "mountainside", name: "Mountainside Recreation Centre" },
    { id: "nelson", name: "Nelson Recreation Centre" },
    { id: "tansley_woods", name: "Tansley Woods Community Centre" },
    { id: "mainway", name: "Mainway Recreation Centre" },
    // Libraries
    { id: "alton_library", name: "Alton Branch Library" },
    { id: "brant_hills_library", name: "Brant Hills Branch Library" },
    { id: "burlington_central_library", name: "Central Branch Library" },
    { id: "appleby_library", name: "New Appleby Line Branch Library" },
    { id: "tansley_library", name: "Tansley Woods Branch Library" },
    // Arenas
    { id: "aldershot_arena", name: "Aldershot Arena" },
    { id: "appleby_ice", name: "Appleby Ice Centre" },
    { id: "central_arena_ice", name: "Central Arena" },
    { id: "mountainside_arena", name: "Mountainside Arena" },
    { id: "nelson_arena", name: "Nelson Arena" },
    { id: "mainway_arena", name: "Mainway Arena" },
    { id: "sherwood_arena", name: "Sherwood Forest Arena" },
  ],
  mississauga: [
    // Community Centres
    { id: "burnhamthorpe", name: "Burnhamthorpe Community Centre" },
    { id: "carmen_corbasson", name: "Carmen Corbasson Community Centre" },
    { id: "churchill_meadows", name: "Churchill Meadows Community Centre" },
    { id: "clarkson", name: "Clarkson Community Centre" },
    { id: "erin_meadows", name: "Erin Meadows Community Centre & Library" },
    { id: "frank_mckechnie", name: "Frank McKechnie Community Centre" },
    { id: "huron_park", name: "Huron Park Community Centre" },
    { id: "malton", name: "Malton Community Centre" },
    { id: "meadowvale", name: "Meadowvale Community Centre" },
    { id: "mississauga_valley", name: "Mississauga Valley Community Centre" },
    { id: "paramount", name: "Paramount Fine Foods Centre" },
    { id: "south_common", name: "South Common Community Centre" },
    { id: "streetsville", name: "Streetsville Community Centre" },
    { id: "river_grove", name: "River Grove Community Centre" },
    // Libraries
    { id: "burnhamthorpe_library", name: "Burnhamthorpe Library" },
    { id: "churchill_library", name: "Churchill Meadows Library" },
    { id: "clarkson_library", name: "Clarkson Library" },
    { id: "courtneypark_library", name: "Courtneypark Library" },
    { id: "erin_meadows_library", name: "Erin Meadows Library" },
    { id: "hazel_library", name: "Hazel McCallion Central Library" },
    { id: "lakeview_library", name: "Lakeview Library" },
    { id: "malton_library", name: "Malton Library" },
    { id: "meadowvale_library", name: "Meadowvale Library" },
    { id: "mississauga_valley_library", name: "Mississauga Valley Library" },
    { id: "port_credit_library", name: "Port Credit Library" },
    { id: "streetsville_library", name: "Streetsville Library" },
    // Arenas
    { id: "burnhamthorpe_arena", name: "Burnhamthorpe Community Centre Arena" },
    { id: "canlan_ice", name: "Canlan Ice Sports – Mississauga" },
    { id: "carmen_arena", name: "Carmen Corbasson Arena" },
    { id: "iceland", name: "Iceland Mississauga" },
    { id: "meadowvale_arena", name: "Meadowvale Ice Arena" },
    { id: "mississauga_valley_arena", name: "Mississauga Valley Arena" },
    { id: "port_credit_arena", name: "Port Credit Arena" },
    { id: "river_grove_rink", name: "Rink at River Grove" },
    { id: "tomken_rinks", name: "Tomken Twin Rinks" },
  ],
};

const MOCK_CITIES = [
  { id: "oakville", name: "Oakville" },
  { id: "burlington", name: "Burlington" },
  { id: "mississauga", name: "Mississauga" },
];

const MOCK_ACTIVITY_TYPES = [
  { id: "fitness", name: "Fitness" },
  { id: "swim", name: "Swimming" },
  { id: "skating", name: "Skating & Hockey" },
  { id: "sports", name: "Sports" },
  { id: "other", name: "Others" },
];

const MOCK_AGE_GROUPS = [
  { id: "adult", name: "Adult" },
  { id: "senior", name: "Seniors" },
  { id: "youth", name: "Youth" },
  { id: "child", name: "Children" },
  { id: "family", name: "Family/All Ages" },
];

// Toggle this to use mock data (useful when backend is not running)
const USE_MOCK_DATA = false;

// Get the local IP address for development
const getApiUrl = () => {
  if (!__DEV__) {
    return "https://api.obmrecfind.com/api/v1";
  }
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) {
    return `http://${debuggerHost}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
};

const API_URL = getApiUrl();

// Custom params serializer for FastAPI compatibility
// FastAPI expects: cities=oakville&cities=burlington (not cities[]=oakville)
const paramsSerializer = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      // Repeat key for each array value (FastAPI style)
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
};

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds - scraping takes time
  paramsSerializer: paramsSerializer,
});

client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ============================================================================
// Search Parameters Interface
// ============================================================================

export interface SearchParams {
  city?: string;
  cities?: string[];
  locations?: string[];
  activityTypes?: string[];
  ageGroups?: string[];
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  limit?: number;
}

// ============================================================================
// API Functions
// ============================================================================

export const api = {
  /**
   * Search for drop-in programs with filters
   */
  searchPrograms: async (params: SearchParams) => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let results = [...MOCK_PROGRAMS];

      // City filter (single or multiple)
      if (params?.city) {
        results = results.filter((p) => p.city.toLowerCase() === params.city!.toLowerCase());
      }
      if (params?.cities && params.cities.length > 0) {
        results = results.filter((p) => params.cities!.includes(p.city.toLowerCase()));
      }

      // Location filter
      if (params?.locations && params.locations.length > 0) {
        results = results.filter((p) => params.locations!.includes(p.location_id));
      }

      // Activity type filter
      if (params?.activityTypes && params.activityTypes.length > 0) {
        results = results.filter((p) => params.activityTypes!.includes(p.activity_type));
      }

      // Age group filter
      if (params?.ageGroups && params.ageGroups.length > 0) {
        results = results.filter((p) => params.ageGroups!.includes(p.age_group));
      }

      // Date range filter
      if (params?.dateFrom) {
        results = results.filter((p) => p.date >= params.dateFrom!);
      }
      if (params?.dateTo) {
        results = results.filter((p) => p.date <= params.dateTo!);
      }

      // Text search
      if (params?.query) {
        const q = params.query.toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.location_name.toLowerCase().includes(q)
        );
      }

      // Apply limit
      const limit = params?.limit || 50;
      results = results.slice(0, limit);

      return { programs: results, total: results.length };
    }

    // Real API call
    const res = await client.get("/programs", { params });
    return res.data;
  },

  /**
   * Get community center locations
   */
  getLocations: async (city?: string) => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (city) {
        const locations = MOCK_LOCATIONS[city.toLowerCase()] || [];
        return locations.map((loc) => ({ ...loc, city: city.toLowerCase() }));
      }
      // Return all locations
      const all: Array<{ id: string; name: string; city: string }> = [];
      for (const [cityName, locations] of Object.entries(MOCK_LOCATIONS)) {
        for (const loc of locations) {
          all.push({ ...loc, city: cityName });
        }
      }
      return all;
    }
    const res = await client.get("/locations", { params: city ? { city } : {} });
    return res.data;
  },

  /**
   * Get list of supported cities
   */
  getCities: async () => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return MOCK_CITIES;
    }
    const res = await client.get("/locations/cities");
    return res.data;
  },

  /**
   * Get list of activity types
   */
  getActivityTypes: async () => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return MOCK_ACTIVITY_TYPES;
    }
    const res = await client.get("/locations/activity-types");
    return res.data;
  },

  /**
   * Get list of age groups
   */
  getAgeGroups: async () => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return MOCK_AGE_GROUPS;
    }
    const res = await client.get("/locations/age-groups");
    return res.data;
  },

  /**
   * Get subscription products
   */
  getProducts: async () => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        products: [
          { id: "premium_monthly", name: "Premium Monthly", price: 4.99, period: "month" },
          { id: "premium_yearly", name: "Premium Yearly", price: 39.99, period: "year" },
        ],
      };
    }
    const res = await client.get("/subscriptions/products");
    return res.data;
  },
};
