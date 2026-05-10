# Trosky AI Inquiry Layer

This document defines the hotel-side AI inquiry layer for Trosky. It is the product and technical guide for building from the current revenue-intelligence dashboard toward an AI-assisted hotel sales system that captures demand, qualifies leads, identifies group intent, and turns qualified opportunities into structured RFPs and proposals.

## 1. Product Intent

The inquiry layer is the first bridge between Trosky's existing hotel revenue cockpit and the future group booking marketplace.

Today, Trosky helps hotels understand rates, occupancy, competitor pressure, events, and recommendations. The inquiry layer adds demand capture:

- A guest, planner, company, school, or group organizer asks about availability or pricing.
- Trosky stores the conversation and extracts structured buying intent.
- Hotel teams can see, triage, respond to, qualify, and convert the lead.
- Group intent can become a structured RFP.
- Pricing intelligence can eventually suggest proposal rates using Trosky's existing recommendation engine.

The first implementation should be useful without external AI or channel integrations. AI classification, WhatsApp, web chat, Instagram, and booking engine integrations can be added behind the same domain model.

## 2. Core Jobs To Be Done

For hotel sales and revenue teams:

- See all booking inquiries in one place.
- Understand which leads are individual stays vs. group or event opportunities.
- Avoid missing high-value after-hours or social-channel leads.
- Quickly collect missing qualification details.
- Convert group demand into a structured RFP.
- Create and track hotel proposals.
- Use revenue context when deciding what price to quote.

For guests and organizers:

- Ask in natural language.
- Get fast responses.
- Avoid long RFP forms at the start.
- Receive clear proposals that can be compared and accepted.

For Trosky as a platform:

- Build a proprietary lead dataset.
- Learn which inquiry attributes predict conversion.
- Seed future marketplace liquidity from captured demand.
- Create multiple revenue paths: hotel SaaS, commission on closed group business, premium AI automation.

## 3. First Slice Scope

The first slice is a hotel-side inquiry inbox, not a full chatbot.

Included:

- Inquiry storage.
- Conversation message storage.
- Intent/status/priority classification fields.
- Manual inquiry creation.
- Manual status updates.
- Staff notes/messages.
- Structured group RFP shell.
- Proposal shell.
- Deterministic inquiry analysis service with the same shape future AI model output should use.
- Public inquiry capture endpoint for web chat/form integrations.
- Role-aware access: analysts can see all hotels, clients only their assigned hotels.

Not included in the first slice:

- Live AI model calls. The current analyzer is deterministic and model-ready.
- WhatsApp/Instagram/Facebook integrations.
- Public embeddable web chat widget.
- Booking engine availability checks.
- Contracting, e-signature, payment, or commission settlement.
- Multi-hotel marketplace routing.

This lets development land a durable foundation before adding automation.

## 4. Domain Model

### Inquiry

An inquiry is the central lead/opportunity object.

Key fields:

- `hotelId`: hotel receiving or owning the lead.
- `source`: where it came from, such as web chat, WhatsApp, Instagram, email, or manual entry.
- `intent`: AI or staff classification: individual booking, group rooms, meeting/event, wedding, school trip, corporate offsite, general, unknown.
- `status`: sales stage: new, qualifying, RFP ready, proposal sent, won, lost, spam.
- `priority`: low, normal, high, urgent.
- Contact fields: guest name, email, phone, organization.
- Stay/event fields: check-in, check-out, guest count, room count, budget, event space needed, catering needed.
- `summary`: human-readable lead summary.
- `aiConfidence` and `aiExtractedJson`: future AI extraction output.

### InquiryMessage

Messages are the conversation history attached to an inquiry.

Sender types:

- `GUEST`: external customer or planner.
- `AI`: future AI assistant.
- `STAFF`: hotel team, analyst, or client user.
- `SYSTEM`: status changes, imports, automations.

### GroupRfp

The structured representation of group demand. It is created when an inquiry has enough information to become an RFP.

Key fields:

- Event type.
- Flexible dates flag.
- Rooms per night.
- Attendee count.
- Meeting room setup.
- Food and beverage needs.
- Decision date.
- Notes.

### InquiryProposal

The hotel's proposal response to an inquiry or RFP.

Key fields:

- Room rate.
- Total estimate.
- Currency.
- Room block.
- Cutoff date.
- Cancellation terms.
- Notes.
- Status: draft, sent, accepted, declined, expired.
- Created by user.

## 5. Lifecycle

Basic lifecycle:

1. `NEW`: lead arrives or is manually created.
2. `QUALIFYING`: staff or AI is collecting missing details.
3. `RFP_READY`: enough group details exist to ask hotel sales/revenue for a proposal.
4. `PROPOSAL_SENT`: hotel has sent a quote/proposal.
5. `WON`: booking was accepted or confirmed.
6. `LOST`: lead was declined, abandoned, or booked elsewhere.
7. `SPAM`: invalid or junk lead.

The first implementation allows manual stage changes. Later AI can suggest the stage, but staff should remain in control.

## 6. Intent Classification

The platform should classify inquiry intent conservatively.

Initial labels:

- `INDIVIDUAL_BOOKING`: normal transient room booking.
- `GROUP_ROOMS`: multi-room block without clear event component.
- `MEETING_EVENT`: meeting space, conference, banquet, or event inquiry.
- `WEDDING`: wedding room block or wedding event.
- `SCHOOL_TRIP`: educational group travel.
- `CORPORATE_OFFSITE`: team offsite, retreat, workshop, sales kickoff.
- `GENERAL`: hotel question without booking intent.
- `UNKNOWN`: not enough information.

Future AI classification should output:

- intent label,
- confidence,
- extracted fields,
- missing fields,
- suggested next reply,
- recommended status.

## 7. Access Control

Analysts:

- View all active hotels' inquiries.
- Create and update inquiries for any hotel.
- Add messages.
- Create RFP details.
- Create proposals.
- Mark opportunities won/lost/spam.

Clients:

- View inquiries for hotels they have `HotelAccess` to.
- Create manual inquiries for their own hotel.
- Add staff messages/notes.
- Update status for their own hotel's inquiries.

Future refinement may separate hotel client permissions into `OWNER`, `SALES`, `REVENUE`, and `READ_ONLY`.

## 8. Data Flow

First slice:

Manual entry -> `Inquiry` -> optional `InquiryMessage` -> optional `GroupRfp` -> optional `InquiryProposal`.

Public capture:

`POST /api/inquiries/public` -> validate payload -> rate limit by IP -> create `Inquiry` and first `InquiryMessage` -> run deterministic analysis -> persist `aiExtractedJson` and `aiConfidence`.

Public form:

`/inquire` lists active hotels and submits to `POST /api/inquiries/public`. This is the first public capture surface and can later become the embeddable widget source.

Future AI flow:

Channel event -> conversation message -> AI extraction -> inquiry create/update -> missing-field prompts -> RFP/proposal workflow.

Future marketplace flow:

Group inquiry -> normalized RFP -> matching hotels -> hotel proposals -> buyer comparison -> accepted proposal -> booking/commission.

## 9. AI Architecture Direction

AI should be added as a service layer, not embedded directly in UI components.

Current configuration placeholders:

- `INQUIRY_AI_PROVIDER=heuristic` keeps deterministic analysis active.
- `INQUIRY_AI_PROVIDER=openai` is reserved for the model provider seam.
- `INQUIRY_AI_MODEL=gpt-4o-mini` is a placeholder model setting.
- `OPENAI_API_KEY` is the future provider key. Until the model call is implemented, the service falls back to deterministic analysis even if the key is present.

Recommended future modules:

- `inquiry-classifier`: classifies intent/status/priority from message text.
- `field-extractor`: extracts dates, room count, budget, group type, event needs.
- `reply-drafter`: drafts safe staff-reviewed responses.
- `rfp-builder`: maps qualified inquiry to structured RFP.
- `proposal-pricing-assistant`: uses Trosky rates, occupancy, competitor rates, and events to suggest proposal pricing.

AI output must be stored as structured JSON with confidence and provenance. Staff edits should override AI fields.

## 10. Development Phases

### Phase 1: Foundation

- Add database models and enums.
- Add server actions.
- Add inquiry inbox route.
- Add manual inquiry creation.
- Add status/priority/intent fields.
- Add staff messages.
- Add RFP/proposal shells.

### Phase 2: AI Assist

- Add local classifier service interface. **Done.**
- Add "analyze inquiry" action. **Done.**
- Store extracted JSON and confidence. **Done.**
- Show missing fields and suggested next action. **Done.**
- Keep AI behind a feature flag.

### Phase 3: Web Chat Capture

- Add public hotel inquiry endpoint.
- Add embeddable web form/chat widget.
- Create inquiry from anonymous guest messages.
- Add anti-spam and rate limits.

### Phase 4: Group RFP Workflow

- Improve RFP detail form.
- Add proposal comparison-ready structure.
- Add quote PDFs or shareable proposal page.
- Use revenue intelligence for suggested proposal rates.

### Phase 5: Channel Integrations

- WhatsApp via approved provider.
- Instagram/Facebook DMs.
- Email parsing.
- Human handoff rules.

### Phase 6: Marketplace

- Allow qualified RFPs to be routed to multiple hotels.
- Add hotel bidding.
- Add buyer shortlist/comparison.
- Track accepted proposal and commission.

## 11. Product Metrics

Track from day one:

- New inquiries per hotel.
- Source mix.
- Intent mix.
- Group inquiry rate.
- Time to first staff response.
- Inquiry to RFP conversion.
- Proposal sent rate.
- Won/lost rate.
- Estimated value by source and intent.
- AI confidence vs. staff correction rate.

## 12. Implementation Principles

- Keep the first version manually useful.
- Store structured data early; automate later.
- Treat AI as assistive, not authoritative.
- Maintain hotel-level access control everywhere.
- Reuse existing Trosky revenue data instead of creating a disconnected CRM.
- Prefer narrow server actions and explicit schemas over generic JSON mutation endpoints.
- Make the inquiry model marketplace-ready without building the marketplace prematurely.
