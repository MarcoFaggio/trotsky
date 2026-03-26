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

export const searchHotelSchema = z.object({
  query: z.string().min(2).max(100),
});

export type CreateHotelExtendedInput = z.infer<typeof createHotelExtendedSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SearchHotelInput = z.infer<typeof searchHotelSchema>;
export type SignalSuppressionInput = z.infer<typeof signalSuppressionSchema>;
