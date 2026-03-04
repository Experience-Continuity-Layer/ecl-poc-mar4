export type ModelType = "electric" | "hybrid" | "performance";

export interface AureliaModel {
  name: string;
  slug: string;
  category: string;
  type: ModelType;
  price: string;
  tagline: string;
  gradient: string;
  image: string;
  specs: { range: string; acceleration: string; topSpeed: string; chargeTime: string };
  features: string[];
}

export const HERO_IMG =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1400&h=700&fit=crop&auto=format&q=80";

export const OWNERSHIP_IMG =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&h=600&fit=crop&auto=format&q=80";

export const aureliaModels: AureliaModel[] = [
  {
    name: "Astra X",
    slug: "astra-x",
    category: "Fully electric SUV",
    type: "electric",
    price: "From EUR 74,900",
    tagline: "Up to 580 km range",
    gradient: "linear-gradient(135deg, #1a365d 0%, #2b6cb0 60%, #1e4e8c 100%)",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=500&fit=crop&auto=format&q=80",
    specs: { range: "580 km", acceleration: "4.2 s", topSpeed: "210 km/h", chargeTime: "32 min" },
    features: [
      "Lidar-assisted autonomous driving suite",
      "Panoramic fixed glass roof",
      "Adaptive air suspension with road preview",
      "Premium 21-speaker Harman Kardon system",
      "Over-the-air software updates",
    ],
  },
  {
    name: "Orion S",
    slug: "orion-s",
    category: "Plug-in hybrid SUV",
    type: "hybrid",
    price: "From EUR 52,800",
    tagline: "Electric + petrol flexibility",
    gradient: "linear-gradient(135deg, #134e4a 0%, #2d9a7e 60%, #1a7a60 100%)",
    image:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=500&fit=crop&auto=format&q=80",
    specs: {
      range: "82 km EV / 780 km total",
      acceleration: "5.4 s",
      topSpeed: "225 km/h",
      chargeTime: "45 min",
    },
    features: [
      "Intelligent dual-powertrain management",
      "Hands-free tailgate with gesture control",
      "360\u00b0 parking camera with bird\u2019s-eye view",
      "Heated and ventilated Nappa leather seats",
      "Towing capacity up to 2,400 kg",
    ],
  },
  {
    name: "Atlas Tour",
    slug: "atlas-tour",
    category: "Mild hybrid estate",
    type: "hybrid",
    price: "From EUR 46,900",
    tagline: "Long-haul comfort and utility",
    gradient: "linear-gradient(135deg, #374151 0%, #6b7280 60%, #4b5563 100%)",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=500&fit=crop&auto=format&q=80",
    specs: { range: "920 km combined", acceleration: "6.8 s", topSpeed: "230 km/h", chargeTime: "\u2014" },
    features: [
      "Largest cargo volume in class at 1,750 L",
      "Integrated roof rail system with load bars",
      "Pilot Assist with lane centering",
      "Wireless device charging pad",
      "Air quality sensor with PM2.5 filtration",
    ],
  },
  {
    name: "Nova Crossover",
    slug: "nova-crossover",
    category: "Electric crossover",
    type: "electric",
    price: "From EUR 49,200",
    tagline: "Fast charging in 28 min",
    gradient: "linear-gradient(135deg, #312e81 0%, #6d28d9 60%, #4c1d95 100%)",
    image:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=500&fit=crop&auto=format&q=80",
    specs: { range: "460 km", acceleration: "5.1 s", topSpeed: "200 km/h", chargeTime: "28 min" },
    features: [
      "800V architecture for ultra-fast charging",
      "Augmented reality head-up display",
      "Configurable ambient interior lighting",
      "Vehicle-to-load bidirectional charging",
      "Eco route planning with real-time data",
    ],
  },
  {
    name: "Helios GT",
    slug: "helios-gt",
    category: "Performance sedan",
    type: "performance",
    price: "From EUR 63,500",
    tagline: "Dual motor, adaptive chassis",
    gradient: "linear-gradient(135deg, #450a0a 0%, #b91c1c 60%, #7f1d1d 100%)",
    image:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=500&fit=crop&auto=format&q=80",
    specs: { range: "510 km", acceleration: "3.4 s", topSpeed: "250 km/h", chargeTime: "35 min" },
    features: [
      "Dual motor AWD with torque vectoring",
      "Adaptive sport chassis with magnetic dampers",
      "Launch control with customizable profiles",
      "Carbon fiber interior accents",
      "Track mode with telemetry recording",
    ],
  },
  {
    name: "Lumen E",
    slug: "lumen-e",
    category: "Urban electric hatch",
    type: "electric",
    price: "From EUR 39,400",
    tagline: "Compact footprint, premium cabin",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0891b2 60%, #155e75 100%)",
    image:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop&auto=format&q=80",
    specs: { range: "380 km", acceleration: "6.2 s", topSpeed: "180 km/h", chargeTime: "25 min" },
    features: [
      "Compact 4.2 m body with tight turning radius",
      "Single-pedal driving mode",
      '12.3" central touchscreen with haptic feedback',
      "Smartphone as key with secure NFC",
      "Recycled interior materials throughout",
    ],
  },
];

export const aureliaHighlights = [
  {
    title: "Human-centered safety",
    detail:
      "Lidar-assisted sensing, cross-traffic mitigation, and adaptive collision awareness built to support calm driving.",
  },
  {
    title: "Crafted interior calm",
    detail:
      "Tactile natural materials, low-noise cabins, and intuitive controls with reduced visual clutter.",
  },
  {
    title: "Electrification without friction",
    detail:
      "Plan routes with charging built-in, optimize home energy use, and monitor battery health in one ecosystem.",
  },
];

export const aureliaOwnershipData = [
  {
    title: "Service and Care",
    summary: "Transparent service plans with digital booking and remote diagnostics.",
    detail:
      "Our network spans over 200 certified centers. Schedule through the app, receive real-time updates, and approve additional work digitally.",
  },
  {
    title: "Connected Services",
    summary: "Stay connected to your vehicle from anywhere.",
    detail:
      "Pre-condition your cabin, check charge status, locate your vehicle, and receive proactive maintenance alerts\u2009\u2014\u2009all end-to-end encrypted.",
  },
  {
    title: "Fleet and Business",
    summary: "Electrification advisory and analytics for efficiency.",
    detail:
      "Dedicated fleet managers help plan your transition. Access TCO calculators, driver training, and centralized billing across Europe.",
  },
  {
    title: "Insurance and Roadside",
    summary: "Integrated claims and 24/7 support for minimal downtime.",
    detail:
      "File claims from the vehicle screen. Our roadside team averages 28-minute response times. Courtesy vehicles available within 4 hours.",
  },
];

export const aureliaFaqItems = [
  {
    question: "How do I schedule a service appointment?",
    answer:
      "Schedule through the Aurelia Motors app or by calling your nearest center. The app lets you pick date and time, describe concerns, and get a cost estimate before confirming.",
  },
  {
    question: "What warranty coverage comes standard?",
    answer:
      "All vehicles include a 5-year, 100,000 km comprehensive warranty. Electric powertrains are covered for 8 years or 160,000 km. Extended packages are available within the first 12 months.",
  },
  {
    question: "How do over-the-air updates work?",
    answer:
      "Updates download automatically over Wi-Fi. You\u2019ll get a notification to review changes and can install immediately or schedule for later. Most complete in under 20 minutes.",
  },
  {
    question: "Can I transfer my subscription to a new vehicle?",
    answer:
      "Yes. Connected Care subscriptions transfer to any new Aurelia vehicle at no extra cost. Initiate the transfer in account settings or through support.",
  },
  {
    question: "Where can I find public charging stations?",
    answer:
      "The in-car navigation and app show all compatible stations along your route with real-time availability, speeds, and pricing. We partner with major networks across Europe.",
  },
];

export const aureliaSupportTopics = [
  {
    id: "charging-and-battery",
    title: "Charging and battery",
    description: "Troubleshoot charging behavior, range variation, and battery health indicators.",
  },
  {
    id: "software-and-connectivity",
    title: "Software and connectivity",
    description: "Resolve app sync, profile pairing, and over-the-air update issues.",
  },
  {
    id: "roadside-and-service",
    title: "Roadside and service",
    description: "Request roadside support, schedule service visits, and manage claims.",
  },
];

export const aureliaAccountProfile = {
  name: "Alexandra Voss",
  tier: "Premium",
  memberSince: "2023",
};

export const aureliaAccountVehicle = {
  primaryVehicle: "Astra X \u00b7 Performance pack",
  colorAndDelivery: "Midnight blue \u00b7 Delivered Sep 2024",
  mileage: "14,280 km",
  mileageLastSynced: "Last synced today at 09:41",
  nextService: "Mar 18, 2026",
  nextServiceDetail: "City Hub Amsterdam \u00b7 Routine inspection",
};

export const aureliaAccountSubscription = {
  planName: "Connected Care Plus",
  price: "EUR 29/mo",
  renewsOn: "Renews Oct 19, 2026",
  includes: [
    "Remote diagnostics and alerts",
    "Courtesy vehicle on service days",
    "Priority roadside assistance",
    "Extended warranty coverage",
  ],
};

export const aureliaAccountOrders = [
  {
    id: "AM-44281",
    status: "In progress",
    title: "Astra X \u00b7 Delivery prep",
    detail: "ETA 5 days \u00b7 Tracking available",
  },
  {
    id: "AM-43802",
    status: "Confirmed",
    title: "HomeCharge Pro installation",
    detail: "Scheduled for Tuesday, Mar 10",
  },
  {
    id: "AM-43117",
    status: "Complete",
    title: "Connected Care renewal",
    detail: "Paid successfully \u00b7 Feb 14, 2026",
  },
];

export const aureliaAccountPreferences = {
  notifications: "SMS + Email",
  notificationsDetail: "Service reminders, software updates, offers",
  preferredCenter: "City Hub Amsterdam",
  preferredCenterAddress: "Keizersgracht 112, 1015 AA",
  language: "English",
  languageDetail: "Communications and in-car interface",
};

