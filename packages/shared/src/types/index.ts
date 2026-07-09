export type WeightLabel = "Low" | "Medium" | "High";

export const COMPETITOR_WEIGHT_OPTIONS: {
  label: WeightLabel;
  value: number;
  description: string;
}[] = [
  {
    label: "Low",
    value: 0.25,
    description: "Light influence in rate recommendations",
  },
  {
    label: "Medium",
    value: 0.5,
    description: "Standard influence in rate recommendations",
  },
  {
    label: "High",
    value: 0.85,
    description: "Strong influence in rate recommendations",
  },
];

export function weightToLabel(w: number): WeightLabel {
  if (w <= 0.33) return "Low";
  if (w <= 0.66) return "Medium";
  return "High";
}

export function labelToWeight(label: WeightLabel): number {
  return COMPETITOR_WEIGHT_OPTIONS.find((option) => option.label === label)?.value ?? 0.5;
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
  manualEventCount?: number;
  signalNetBps?: number;
  signalPositiveBps?: number;
  signalNegativeBps?: number;
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

export type InquirySource =
  | "WEB_CHAT"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "EMAIL"
  | "PHONE"
  | "MANUAL"
  | "OTHER";

export type InquiryIntent =
  | "INDIVIDUAL_BOOKING"
  | "GROUP_ROOMS"
  | "MEETING_EVENT"
  | "WEDDING"
  | "SCHOOL_TRIP"
  | "CORPORATE_OFFSITE"
  | "GENERAL"
  | "UNKNOWN";

export type InquiryStatus =
  | "NEW"
  | "QUALIFYING"
  | "RFP_READY"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST"
  | "SPAM";

export type InquiryPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type InquiryProposalStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";

export interface InquirySummary {
  id: string;
  hotelId: string;
  hotelName: string;
  source: InquirySource;
  intent: InquiryIntent;
  status: InquiryStatus;
  priority: InquiryPriority;
  guestName: string | null;
  guestEmail: string | null;
  organizationName: string | null;
  summary: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guestCount: number | null;
  roomCount: number | null;
  budgetCents: number | null;
  eventSpaceNeeded: boolean;
  cateringNeeded: boolean;
  aiConfidence: number | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  proposalCount: number;
}

export interface InquiryMessageSummary {
  id: string;
  senderType: "GUEST" | "AI" | "STAFF" | "SYSTEM";
  senderName: string | null;
  body: string;
  createdAt: string;
}

export interface GroupRfpSummary {
  id: string;
  eventType: string | null;
  flexibleDates: boolean;
  roomsPerNight: number | null;
  attendeeCount: number | null;
  meetingRoomSetup: string | null;
  foodAndBeverage: string | null;
  decisionDate: string | null;
  notes: string | null;
}

export interface InquiryProposalSummary {
  id: string;
  roomRateCents: number | null;
  totalEstimateCents: number | null;
  currency: string;
  roomBlock: number | null;
  cutoffDate: string | null;
  cancellationTerms: string | null;
  notes: string | null;
  status: InquiryProposalStatus;
  createdByName: string | null;
  sentAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface InquiryAiAnalysis {
  provider: "heuristic" | "model";
  intent: InquiryIntent;
  confidence: number;
  priority: InquiryPriority;
  suggestedStatus: InquiryStatus;
  summary: string | null;
  extracted: {
    checkIn: string | null;
    checkOut: string | null;
    guestCount: number | null;
    roomCount: number | null;
    budgetCents: number | null;
    eventSpaceNeeded: boolean;
    cateringNeeded: boolean;
    organizationName: string | null;
  };
  missingFields: string[];
  recommendedNextAction: string;
  rationale: string[];
  analyzedAt: string;
}

export interface InquiryDetail extends InquirySummary {
  guestPhone: string | null;
  aiAnalysis: InquiryAiAnalysis | null;
  messages: InquiryMessageSummary[];
  groupRfp: GroupRfpSummary | null;
  proposals: InquiryProposalSummary[];
}

export type RevenueActionType =
  | "PRICE_CHANGE"
  | "EVENT_PRICING"
  | "WATCH_DEMAND"
  | "PARITY_FIX"
  | "STRATEGY_REVIEW"
  | "INQUIRY_REVIEW";

export type RevenueActionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "SNOOZED"
  | "COMPLETED"
  | "EXPIRED";

export type ActionUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ActionConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface RevenueCommandCentreMetrics {
  estimatedUpsideLowCents: number;
  estimatedUpsideHighCents: number;
  urgentActionCount: number;
  urgentDateCount: number;
  pendingActionCount: number;
  parityIssueCount: number;
  eventActionCount: number;
}

export interface RevenueCommandCentreRatePoint {
  date: string;
  yourRateCents: number | null;
  compMedianCents: number | null;
}

export interface RevenueCommandCentreExplanation {
  headline: string;
  body: string;
  bullets: string[];
}

export interface RevenueCommandCentreView {
  scope: {
    mode: "PORTFOLIO" | "HOTEL";
    hotelId?: string;
    hotelName?: string;
  };
  reviewedAt: string;
  metrics: RevenueCommandCentreMetrics;
  actions: RevenueActionView[];
  /** Hotel name per action id (portfolio scope) */
  actionHotelNames: Record<string, string>;
  rateChart: RevenueCommandCentreRatePoint[];
  /** Hotel used for the 14-day rate chart (portfolio uses first active hotel) */
  chartHotelName?: string;
  explanation: RevenueCommandCentreExplanation;
  hasSeededActions: boolean;
  hasLiveActions: boolean;
  /** Active actions in scope before dashboard limit */
  totalActiveCount: number;
  /** Whether TROSKY_DEMO_MODE (or dev default) allows demo actions on surfaces */
  demoModeEnabled: boolean;
  /** Demo actions excluded from this view when demo mode is disabled */
  hiddenDemoActionCount: number;
}

export interface RevenueActionView {
  id: string;
  hotelId: string;
  actionKey: string;
  type: RevenueActionType;
  status: RevenueActionStatus;
  title: string;
  summary: string;
  reason: string | null;
  urgency: ActionUrgency;
  confidence: ActionConfidence;
  stayDate: string | null;
  currentValueCents: number | null;
  recommendedValueCents: number | null;
  estimatedUpsideLowCents: number | null;
  estimatedUpsideHighCents: number | null;
  evidenceJson: Record<string, unknown> | null;
  source: string | null;
  sourceEntityId: string | null;
  createdAt: string;
  updatedAt: string;
  lastEvaluatedAt: string | null;
  expiresAt: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  snoozedUntil: string | null;
}

export interface RevenueActionInsightEvidence {
  currentRateCents?: number | null;
  recommendedRateCents?: number | null;
  rateDeltaCents?: number | null;
  compMedianCents?: number | null;
  compReferenceCents?: number | null;
  rateGapCents?: number | null;
  confidence?: string | null;
  urgency?: string | null;
  recommendationId?: string | null;
  generatedAt?: string | null;
  competitorsSoldOut?: number | null;
  competitorCount?: number | null;
  eventName?: string | null;
  eventDaysAway?: number | null;
  demandLevel?: string | null;
  watchReason?: string | null;
  eventId?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  source?: string | null;
  raw: unknown;
}

export interface RevenueActionInsightExplanation {
  headline: string;
  body: string;
  bullets: string[];
}

export interface RevenueActionInsightView {
  id: string;
  hotelId: string;
  hotelName: string;
  type: RevenueActionType;
  status: RevenueActionStatus;
  title: string;
  summary: string;
  reason: string | null;
  urgency: ActionUrgency;
  confidence: ActionConfidence;
  stayDate: string | null;
  currentValueCents: number | null;
  recommendedValueCents: number | null;
  deltaCents: number | null;
  estimatedUpsideLowCents: number | null;
  estimatedUpsideHighCents: number | null;
  source: string | null;
  sourceEntityId: string | null;
  actionKey: string;
  lastEvaluatedAt: string | null;
  expiresAt: string | null;
  evidence: RevenueActionInsightEvidence;
  explanation: RevenueActionInsightExplanation;
  canManage: boolean;
  canViewRawEvidence: boolean;
  hasLimitedEvidence: boolean;
}

export type RevenueActionInsightResult =
  | { status: "ok"; insight: RevenueActionInsightView }
  | { status: "not_found" }
  | { status: "forbidden" };

export type RateCalendarDayStatus =
  | "URGENT"
  | "WATCH"
  | "HEALTHY"
  | "OPPORTUNITY"
  | "NO_DATA";

export interface RateCalendarDayView {
  date: string;
  dayLabel: string;
  isToday: boolean;
  yourRateCents: number | null;
  compReferenceCents: number | null;
  rateGapCents: number | null;
  status: RateCalendarDayStatus;
  actionCount: number;
  topActionId: string | null;
  topActionTitle: string | null;
  urgency: ActionUrgency | null;
  confidence: ActionConfidence | null;
}

export interface RateCalendarView {
  scope: {
    mode: "HOTEL" | "PORTFOLIO";
    hotelId: string | null;
    hotelName: string | null;
  };
  startDate: string;
  endDate: string;
  days: RateCalendarDayView[];
  summary: {
    urgentCount: number;
    watchCount: number;
    healthyCount: number;
    opportunityCount: number;
    actionCount: number;
  };
}
