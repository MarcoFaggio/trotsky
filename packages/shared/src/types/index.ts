export type WeightLabel = "Low" | "Medium" | "High";

export function weightToLabel(w: number): WeightLabel {
  if (w <= 0.33) return "Low";
  if (w <= 0.66) return "Medium";
  return "High";
}

export function labelToWeight(label: WeightLabel): number {
  switch (label) {
    case "Low":
      return 0.25;
    case "Medium":
      return 0.5;
    case "High":
      return 0.85;
  }
}

export interface DashboardDay {
  date: string;
  ourRate: number | null;
  recommendedRate: number | null;
  compAvgRate: number | null;
  occPercent: number | null;
  occLyPercent: number | null;
  otbRooms: number | null;
  otbLyRooms: number | null;
  hasEvent: boolean;
  hasPromotion: boolean;
  overrideRate: number | null;
  confidence: number | null;
  availableRooms: number | null;
  forecastRooms: number | null;
  forecastPercent: number | null;
  arrivals: number | null;
  departures: number | null;
  overbookingLimit: number | null;
  signalDirection: "POSITIVE_DEMAND" | "NEGATIVE_DISRUPTION" | "NEUTRAL" | null;
  signalImpactBps: number | null;
  signalCount: number;
  competitors: {
    id: string;
    name: string;
    weight: number;
    rate: number | null;
  }[];
}

export interface ImportedSignalSummary {
  id: string;
  hotelId: string;
  hotelName: string;
  externalSignalId: string;
  date: string;
  title: string;
  category:
    | "CONCERT"
    | "SPORTS"
    | "FESTIVAL"
    | "CONVENTION"
    | "SEVERE_WEATHER"
    | "TRANSPORT_DISRUPTION"
    | "CALAMITY"
    | "OTHER";
  direction: "POSITIVE_DEMAND" | "NEGATIVE_DISRUPTION" | "NEUTRAL";
  impactBps: number;
  relevanceScore: number;
  isSuppressed: boolean;
}

export interface ScrapeResult {
  date: Date;
  priceCents: number;
  currency: string;
  ratingValue?: number;
  ratingScale?: number;
}

export interface RecommendationInput {
  ourRate: number;
  competitorRates: { rate: number; weight: number }[];
  occPercent: number | null;
  occTarget: number;
  occLyPercent: number | null;
  otbRooms: number | null;
  otbLyRooms: number | null;
  hasEvent: boolean;
  minRate: number | null;
  maxRate: number | null;
  discountWarning: boolean;
}

export interface RecommendationResult {
  recommendedPriceCents: number;
  confidence: number;
  rationale: string[];
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: "ANALYST" | "CLIENT";
  iat: number;
  exp: number;
}

export interface OverviewHotel {
  id: string;
  name: string;
  city: string | null;
  pmsName: string | null;
  roomCount: number;
  minRate: number | null;
  maxRate: number | null;
  occTarget: number | null;
  thumbnailUrl: string | null;
  lastUpdated: string | null;
  isStale: boolean;
}

export interface SevenDayRate {
  date: string;
  rateCents: number | null;
  changePct: number | null;
  occPercent: number | null;
  isToday: boolean;
}

export interface CompetitorCard {
  id: string;
  name: string;
  currentRate: number | null;
  rating: number | null;
  reviewCount: number | null;
  priceDiffPct: number | null;
  source: string;
  lastUpdated: string | null;
  listingUrl: string | null;
  dataPending: boolean;
  weight: number;
}

export interface OverviewAlerts {
  eventCount: number;
  activePromotions: number;
  discountWarning: boolean;
  staleData: boolean;
}

export interface MessagingSummary {
  unreadCount: number;
  latestSnippet: string | null;
}

export interface OverviewGraphData {
  dates: string[];
  yourHotel: (number | null)[];
  competitors: { id: string; name: string; data: (number | null)[] }[];
  compAvg: (number | null)[];
  recommended: (number | null)[];
  occupancy: (number | null)[];
}

export interface OverviewData {
  hotel: OverviewHotel;
  sevenDayRates: SevenDayRate[];
  graphData: OverviewGraphData;
  competitorCards: CompetitorCard[];
  alerts: OverviewAlerts;
  messagingSummary: MessagingSummary;
  roleFlags: {
    showSearch: boolean;
    showAddHotel: boolean;
    showEdit: boolean;
    showClientBadge: boolean;
  };
}

export interface MessageThreadSummary {
  id: string;
  hotelId: string;
  hotelName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  lastMessage: {
    body: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  body: string;
  senderUserId: string;
  senderName: string;
  senderRole: "ANALYST" | "CLIENT";
  createdAt: string;
  readAt: string | null;
}
