import type {
  InquiryAiAnalysis,
  InquiryIntent,
  InquiryPriority,
  InquiryStatus,
} from "@hotel-pricing/shared";

type AnalyzeInput = {
  summary?: string | null;
  messages: string[];
  organizationName?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  roomCount?: number | null;
  guestCount?: number | null;
  budgetCents?: number | null;
  eventSpaceNeeded?: boolean;
  cateringNeeded?: boolean;
};

type InquiryAiProvider = "heuristic" | "openai";

function getInquiryAiProvider(): InquiryAiProvider {
  const provider = process.env.INQUIRY_AI_PROVIDER?.toLowerCase();
  return provider === "openai" ? "openai" : "heuristic";
}

const MONEY_RE = /(?:[$£€]\s?|\b(?:usd|eur|gbp)\s?)(\d{2,6})(?:[,.]\d{2})?|\b(\d{2,6})\s?(?:usd|eur|gbp|dollars|euros|pounds)\b/i;
const ROOM_RE = /\b(\d{1,4})\s?(?:rooms?|bedrooms?|room block|room nights?)\b/i;
const GUEST_RE = /\b(\d{1,5})\s?(?:guests?|people|attendees?|delegates?|students?|travelers?|travellers?|pax)\b/i;
const ISO_DATE_RE = /\b(20\d{2}-\d{2}-\d{2})\b/g;

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function extractFirstNumber(text: string, regex: RegExp): number | null {
  const match = text.match(regex);
  if (!match) return null;
  const raw = match[1] || match[2];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferIntent(text: string): {
  intent: InquiryIntent;
  confidence: number;
  rationale: string[];
} {
  const rationale: string[] = [];

  if (includesAny(text, ["wedding", "bride", "groom", "bridal"])) {
    rationale.push("Wedding language detected.");
    return { intent: "WEDDING", confidence: 0.86, rationale };
  }
  if (includesAny(text, ["school", "students", "teacher", "class trip", "educational"])) {
    rationale.push("Education or school trip language detected.");
    return { intent: "SCHOOL_TRIP", confidence: 0.82, rationale };
  }
  if (includesAny(text, ["offsite", "retreat", "workshop", "team building", "sales kickoff"])) {
    rationale.push("Corporate offsite language detected.");
    return { intent: "CORPORATE_OFFSITE", confidence: 0.82, rationale };
  }
  if (includesAny(text, ["meeting room", "conference", "banquet", "event space", "catering", "av ", "a/v"])) {
    rationale.push("Meeting or event requirements detected.");
    return { intent: "MEETING_EVENT", confidence: 0.78, rationale };
  }
  if (includesAny(text, ["group", "block", "multiple rooms", "team", "crew"])) {
    rationale.push("Group or room-block language detected.");
    return { intent: "GROUP_ROOMS", confidence: 0.74, rationale };
  }
  if (includesAny(text, ["room", "stay", "reservation", "booking", "available", "availability"])) {
    rationale.push("Individual booking language detected.");
    return { intent: "INDIVIDUAL_BOOKING", confidence: 0.62, rationale };
  }
  if (includesAny(text, ["parking", "pool", "breakfast", "check in", "check-in"])) {
    rationale.push("General hotel question language detected.");
    return { intent: "GENERAL", confidence: 0.55, rationale };
  }

  rationale.push("Not enough clear booking language was detected.");
  return { intent: "UNKNOWN", confidence: 0.25, rationale };
}

function inferPriority(
  text: string,
  intent: InquiryIntent,
  roomCount: number | null,
  guestCount: number | null
): InquiryPriority {
  if (includesAny(text, ["urgent", "asap", "today", "tomorrow", "tonight"])) {
    return "URGENT";
  }
  if (
    ["GROUP_ROOMS", "MEETING_EVENT", "WEDDING", "SCHOOL_TRIP", "CORPORATE_OFFSITE"].includes(intent) &&
    ((roomCount ?? 0) >= 10 || (guestCount ?? 0) >= 20)
  ) {
    return "HIGH";
  }
  if (intent === "UNKNOWN" || intent === "GENERAL") {
    return "NORMAL";
  }
  return "NORMAL";
}

function summarize(text: string): string | null {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

function missingFieldsFor(intent: InquiryIntent, input: AnalyzeInput, extracted: InquiryAiAnalysis["extracted"]) {
  const missing: string[] = [];
  const needsBookingDates = intent !== "GENERAL" && intent !== "UNKNOWN";
  const isGroup =
    intent === "GROUP_ROOMS" ||
    intent === "MEETING_EVENT" ||
    intent === "WEDDING" ||
    intent === "SCHOOL_TRIP" ||
    intent === "CORPORATE_OFFSITE";

  if (needsBookingDates && !input.checkIn && !extracted.checkIn) missing.push("check-in date");
  if (needsBookingDates && !input.checkOut && !extracted.checkOut) missing.push("check-out date");
  if (isGroup && !input.roomCount && !extracted.roomCount) missing.push("room count");
  if (isGroup && !input.guestCount && !extracted.guestCount) missing.push("guest or attendee count");
  if (intent === "MEETING_EVENT" && !extracted.eventSpaceNeeded) missing.push("meeting room setup");
  if (!input.organizationName && !extracted.organizationName && isGroup) missing.push("organization name");
  return missing;
}

function analyzeInquiryHeuristic(input: AnalyzeInput): InquiryAiAnalysis {
  const text = [input.summary, ...input.messages].filter(Boolean).join("\n").toLowerCase();
  const originalText = [input.summary, ...input.messages].filter(Boolean).join("\n");
  const intentResult = inferIntent(text);
  const roomCount = input.roomCount ?? extractFirstNumber(text, ROOM_RE);
  const guestCount = input.guestCount ?? extractFirstNumber(text, GUEST_RE);
  const money = extractFirstNumber(text, MONEY_RE);
  const dates = Array.from(originalText.matchAll(ISO_DATE_RE)).map((match) => match[1]);
  const eventSpaceNeeded =
    input.eventSpaceNeeded ||
    includesAny(text, ["meeting room", "conference room", "event space", "banquet", "ballroom"]);
  const cateringNeeded =
    input.cateringNeeded ||
    includesAny(text, ["catering", "breakfast", "lunch", "dinner", "coffee break", "f&b", "food"]);

  const extracted = {
    checkIn: input.checkIn ?? dates[0] ?? null,
    checkOut: input.checkOut ?? dates[1] ?? null,
    guestCount,
    roomCount,
    budgetCents: input.budgetCents ?? (money ? money * 100 : null),
    eventSpaceNeeded,
    cateringNeeded,
    organizationName: input.organizationName ?? null,
  };

  const priority = inferPriority(text, intentResult.intent, roomCount, guestCount);
  const missingFields = missingFieldsFor(intentResult.intent, input, extracted);
  const suggestedStatus: InquiryStatus =
    missingFields.length > 0 ? "QUALIFYING" : intentResult.intent === "UNKNOWN" ? "NEW" : "RFP_READY";

  return {
    provider: "heuristic",
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    priority,
    suggestedStatus,
    summary: summarize(originalText),
    extracted,
    missingFields,
    recommendedNextAction:
      missingFields.length > 0
        ? `Ask for ${missingFields.slice(0, 3).join(", ")}.`
        : "Enough detail is available to prepare an RFP or proposal.",
    rationale: intentResult.rationale,
    analyzedAt: new Date().toISOString(),
  };
}

async function analyzeInquiryWithOpenAiPlaceholder(
  input: AnalyzeInput
): Promise<InquiryAiAnalysis> {
  const fallback = analyzeInquiryHeuristic(input);
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.INQUIRY_AI_MODEL || "gpt-4o-mini";

  return {
    ...fallback,
    provider: "heuristic",
    rationale: [
      ...fallback.rationale,
      hasKey
        ? `OpenAI provider placeholder configured for ${model}; using heuristic fallback until model call is implemented.`
        : "OpenAI provider selected but OPENAI_API_KEY is not set; using heuristic fallback.",
    ],
  };
}

export async function analyzeInquiry(input: AnalyzeInput): Promise<InquiryAiAnalysis> {
  const provider = getInquiryAiProvider();
  if (provider === "openai") {
    return analyzeInquiryWithOpenAiPlaceholder(input);
  }
  return analyzeInquiryHeuristic(input);
}
