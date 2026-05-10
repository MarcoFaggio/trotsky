import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createHotelSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  pmsName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  roomCount: z.number().int().positive().default(100),
  minRate: z.number().int().positive().optional(),
  maxRate: z.number().int().positive().optional(),
  occTarget: z.number().min(0).max(100).optional(),
  expediaUrl: z.string().url("Invalid Expedia URL").optional().or(z.literal("")),
  bookingUrl: z.string().url("Invalid Booking URL").optional().or(z.literal("")),
});

export const updateHotelSchema = createHotelSchema.partial().extend({
  id: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const competitorSchema = z.object({
  name: z.string().min(1, "Competitor name is required"),
  expediaUrl: z.string().url("Invalid Expedia URL"),
  bookingUrl: z.string().url("Invalid Booking URL").optional().or(z.literal("")),
});

export const hotelCompetitorSchema = z.object({
  hotelId: z.string(),
  competitorId: z.string(),
  weight: z.number().min(0).max(1).default(0.5),
  active: z.boolean().default(true),
});

export const occupancyEntrySchema = z.object({
  hotelId: z.string(),
  date: z.string().or(z.date()),
  occPercent: z.number().min(0).max(100).optional(),
  roomsOnBooks: z.number().int().min(0).optional(),
  occLyPercent: z.number().min(0).max(100).optional(),
  otbLyRooms: z.number().int().min(0).optional(),
  availableRooms: z.number().int().min(0).optional(),
  forecastRooms: z.number().int().min(0).optional(),
  forecastPercent: z.number().min(0).max(100).optional(),
  arrivals: z.number().int().min(0).optional(),
  departures: z.number().int().min(0).optional(),
  overbookingLimit: z.number().int().min(0).optional(),
});

export const bulkOccupancySchema = z.object({
  entries: z.array(occupancyEntrySchema),
});

export const promotionSchema = z.object({
  hotelId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  terms: z.string().optional(),
});

export const eventSchema = z.object({
  hotelId: z.string(),
  date: z.string().or(z.date()),
  title: z.string().min(1),
  notes: z.string().optional(),
});

export const priceOverrideSchema = z.object({
  hotelId: z.string(),
  date: z.string().or(z.date()),
  overridePriceCents: z.number().int().positive(),
  reason: z.string().optional(),
});

export const ratePlanSchema = z.object({
  hotelId: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  discountPercent: z.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});

export const discountMixSchema = z.object({
  hotelId: z.string(),
  date: z.string().or(z.date()),
  mixes: z.array(
    z.object({
      planId: z.string(),
      sharePercent: z.number().min(0).max(100),
    })
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type CompetitorInput = z.infer<typeof competitorSchema>;
export type HotelCompetitorInput = z.infer<typeof hotelCompetitorSchema>;
export type OccupancyEntryInput = z.infer<typeof occupancyEntrySchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type PriceOverrideInput = z.infer<typeof priceOverrideSchema>;
export type RatePlanInput = z.infer<typeof ratePlanSchema>;
export type DiscountMixInput = z.infer<typeof discountMixSchema>;

export const createHotelExtendedSchema = createHotelSchema.extend({
  city: z.string().optional(),
  countryCode: z.string().length(2).optional().or(z.literal("")),
  regionCode: z.string().optional(),
  market: z.string().optional(),
  submarket: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export const signalSuppressionSchema = z.object({
  hotelId: z.string(),
  externalSignalId: z.string(),
  date: z.string().or(z.date()),
  reason: z.enum([
    "IRRELEVANT",
    "DUPLICATE",
    "LOW_CONFIDENCE",
    "MANUAL_OVERRIDE",
    "OTHER",
  ]),
  note: z.string().max(500).optional(),
});

export const messageSchema = z.object({
  threadId: z.string().optional(),
  hotelId: z.string(),
  body: z.string().min(1, "Message cannot be empty").max(2000),
});

export const inquirySourceSchema = z.enum([
  "WEB_CHAT",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "EMAIL",
  "PHONE",
  "MANUAL",
  "OTHER",
]);

export const inquiryIntentSchema = z.enum([
  "INDIVIDUAL_BOOKING",
  "GROUP_ROOMS",
  "MEETING_EVENT",
  "WEDDING",
  "SCHOOL_TRIP",
  "CORPORATE_OFFSITE",
  "GENERAL",
  "UNKNOWN",
]);

export const inquiryStatusSchema = z.enum([
  "NEW",
  "QUALIFYING",
  "RFP_READY",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "SPAM",
]);

export const inquiryPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

export const createInquirySchema = z.object({
  hotelId: z.string(),
  source: inquirySourceSchema.default("MANUAL"),
  intent: inquiryIntentSchema.default("UNKNOWN"),
  priority: inquiryPrioritySchema.default("NORMAL"),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")),
  guestPhone: z.string().optional(),
  organizationName: z.string().optional(),
  summary: z.string().max(2000).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guestCount: z.number().int().min(0).optional(),
  roomCount: z.number().int().min(0).optional(),
  budgetCents: z.number().int().min(0).optional(),
  eventSpaceNeeded: z.boolean().default(false),
  cateringNeeded: z.boolean().default(false),
  initialMessage: z.string().max(4000).optional(),
});

export const updateInquiryStatusSchema = z.object({
  inquiryId: z.string(),
  status: inquiryStatusSchema,
  priority: inquiryPrioritySchema.optional(),
  intent: inquiryIntentSchema.optional(),
});

export const inquiryMessageSchema = z.object({
  inquiryId: z.string(),
  body: z.string().min(1).max(4000),
});

export const groupRfpSchema = z.object({
  inquiryId: z.string(),
  eventType: z.string().optional(),
  flexibleDates: z.boolean().default(false),
  roomsPerNight: z.number().int().min(0).optional(),
  attendeeCount: z.number().int().min(0).optional(),
  meetingRoomSetup: z.string().optional(),
  foodAndBeverage: z.string().optional(),
  decisionDate: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export const inquiryProposalSchema = z.object({
  inquiryId: z.string(),
  roomRateCents: z.number().int().min(0).optional(),
  totalEstimateCents: z.number().int().min(0).optional(),
  roomBlock: z.number().int().min(0).optional(),
  cutoffDate: z.string().optional(),
  cancellationTerms: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
  expiresAt: z.string().optional(),
});

export const publicInquirySchema = z
  .object({
    hotelId: z.string(),
    name: z.string().max(120).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().max(80).optional(),
    organizationName: z.string().max(160).optional(),
    message: z.string().min(5).max(4000),
    source: inquirySourceSchema.default("WEB_CHAT"),
    /** Honeypot — must stay empty (bots fill hidden fields). */
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.website != null && data.website.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid inquiry payload",
        path: ["website"],
      });
    }
  });

export const searchHotelSchema = z.object({
  query: z.string().min(2).max(100),
});

export type CreateHotelExtendedInput = z.infer<typeof createHotelExtendedSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SearchHotelInput = z.infer<typeof searchHotelSchema>;
export type SignalSuppressionInput = z.infer<typeof signalSuppressionSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
export type InquiryMessageInput = z.infer<typeof inquiryMessageSchema>;
export type GroupRfpInput = z.infer<typeof groupRfpSchema>;
export type InquiryProposalInput = z.infer<typeof inquiryProposalSchema>;
export type PublicInquiryInput = z.infer<typeof publicInquirySchema>;
