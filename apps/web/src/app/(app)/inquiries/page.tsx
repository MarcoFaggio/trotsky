import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@hotel-pricing/db";
import {
  addInquiryMessage,
  analyzeInquiry,
  createInquiryProposal,
  createManualInquiry,
  getInquiries,
  getInquiryDetail,
  updateInquiryStatus,
  upsertGroupRfp,
} from "@/actions/inquiries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { ExternalLink, Inbox, MousePointerClick } from "lucide-react";
import { formatCurrency } from "@hotel-pricing/shared";
import type {
  InquiryDetail,
  InquiryIntent,
  InquiryPriority,
  InquiryStatus,
} from "@hotel-pricing/shared";

const INTENTS: InquiryIntent[] = [
  "UNKNOWN",
  "INDIVIDUAL_BOOKING",
  "GROUP_ROOMS",
  "MEETING_EVENT",
  "WEDDING",
  "SCHOOL_TRIP",
  "CORPORATE_OFFSITE",
  "GENERAL",
];

const STATUSES: InquiryStatus[] = [
  "NEW",
  "QUALIFYING",
  "RFP_READY",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "SPAM",
];

const PRIORITIES: InquiryPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

function titleize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function statusVariant(status: InquiryStatus) {
  if (status === "WON") return "success";
  if (status === "LOST" || status === "SPAM") return "destructive";
  if (status === "PROPOSAL_SENT" || status === "RFP_READY") return "warning";
  return "secondary";
}

function priorityVariant(priority: InquiryPriority) {
  if (priority === "URGENT" || priority === "HIGH") return "warning";
  return "outline";
}

function SelectField({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {titleize(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HotelSelect({
  id,
  hotels,
  defaultValue,
}: {
  id: string;
  hotels: { id: string; name: string }[];
  defaultValue?: string;
}) {
  return (
    <Select name="hotelId" defaultValue={defaultValue}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select hotel" />
      </SelectTrigger>
      <SelectContent>
        {hotels.map((hotel) => (
          <SelectItem key={hotel.id} value={hotel.id}>
            {hotel.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyDetail() {
  return (
    <EmptyState
      icon={MousePointerClick}
      title="No inquiry selected"
      description="Select an inquiry from the list to qualify the lead, add RFP details, and send a proposal."
    />
  );
}

function InquiryDetailPanel({
  inquiry,
  showAnalyze,
}: {
  inquiry: InquiryDetail;
  showAnalyze: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">
                {inquiry.guestName || inquiry.organizationName || "Untitled inquiry"}
              </CardTitle>
              <CardDescription>
                {inquiry.hotelName}
                <span className="text-muted-foreground">
                  {" · "}
                  {titleize(inquiry.source)}
                </span>
                {inquiry.guestEmail ? ` · ${inquiry.guestEmail}` : ""}
                {inquiry.guestPhone ? ` · ${inquiry.guestPhone}` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(inquiry.status)}>
                {titleize(inquiry.status)}
              </Badge>
              <Badge variant={priorityVariant(inquiry.priority)}>
                {titleize(inquiry.priority)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateInquiryStatus} className="grid gap-3 md:grid-cols-4">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <div className="space-y-1">
              <Label htmlFor="inquiry-status">Status</Label>
              <SelectField id="inquiry-status" name="status" defaultValue={inquiry.status} options={STATUSES} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inquiry-intent">Intent</Label>
              <SelectField id="inquiry-intent" name="intent" defaultValue={inquiry.intent} options={INTENTS} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inquiry-priority">Priority</Label>
              <SelectField id="inquiry-priority" name="priority" defaultValue={inquiry.priority} options={PRIORITIES} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Update</Button>
            </div>
          </form>

          <div className="grid gap-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Stay Dates</p>
              <p>{inquiry.checkIn || "TBD"} to {inquiry.checkOut || "TBD"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rooms / Guests</p>
              <p>{inquiry.roomCount ?? "TBD"} rooms · {inquiry.guestCount ?? "TBD"} guests</p>
            </div>
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p>{inquiry.budgetCents ? formatCurrency(inquiry.budgetCents) : "TBD"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Needs</p>
              <p>
                {inquiry.eventSpaceNeeded ? "Event space" : "Rooms"}
                {inquiry.cateringNeeded ? " + catering" : ""}
              </p>
            </div>
          </div>

          {inquiry.summary && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              {inquiry.summary}
            </div>
          )}

          {showAnalyze && (
            <div className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Smart lead scoring</p>
                  <p className="text-xs text-muted-foreground">
                    Heuristic scoring — flags intent, urgency, and fit from the message text.
                  </p>
                </div>
                <form action={analyzeInquiry}>
                  <input type="hidden" name="inquiryId" value={inquiry.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Analyze
                  </Button>
                </form>
              </div>
              {inquiry.aiAnalysis ? (
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p>{Math.round(inquiry.aiAnalysis.confidence * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Action</p>
                    <p>{inquiry.aiAnalysis.recommendedNextAction}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Missing Fields</p>
                    <p>
                      {inquiry.aiAnalysis.missingFields.length > 0
                        ? inquiry.aiAnalysis.missingFields.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No analysis has been run yet.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
          <CardDescription>Guest messages, staff notes, and future AI replies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {inquiry.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              inquiry.messages.map((message) => (
                <div key={message.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <Badge variant="outline">{titleize(message.senderType)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              ))
            )}
          </div>
          <form action={addInquiryMessage} className="space-y-2">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <Textarea
              name="body"
              rows={3}
              placeholder="Add a staff note or reply context"
              aria-label="Add a staff note or reply context"
            />
            <Button type="submit" size="sm">Add note</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group RFP Details</CardTitle>
            <CardDescription>Structure group demand once the inquiry is qualified.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={upsertGroupRfp} className="space-y-3">
              <input type="hidden" name="inquiryId" value={inquiry.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="rfp-event-type">Event Type</Label>
                  <Input id="rfp-event-type" name="eventType" defaultValue={inquiry.groupRfp?.eventType ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rfp-decision-date">Decision Date</Label>
                  <Input id="rfp-decision-date" type="date" name="decisionDate" defaultValue={inquiry.groupRfp?.decisionDate ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rfp-rooms-per-night">Rooms Per Night</Label>
                  <Input id="rfp-rooms-per-night" type="number" name="roomsPerNight" defaultValue={inquiry.groupRfp?.roomsPerNight ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rfp-attendees">Attendees</Label>
                  <Input id="rfp-attendees" type="number" name="attendeeCount" defaultValue={inquiry.groupRfp?.attendeeCount ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="rfp-meeting-room-setup">Meeting Room Setup</Label>
                <Input id="rfp-meeting-room-setup" name="meetingRoomSetup" defaultValue={inquiry.groupRfp?.meetingRoomSetup ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rfp-food-and-beverage">Food & Beverage</Label>
                <Input id="rfp-food-and-beverage" name="foodAndBeverage" defaultValue={inquiry.groupRfp?.foodAndBeverage ?? ""} />
              </div>
              <label htmlFor="rfp-flexible-dates" className="flex items-center gap-2 text-sm">
                <input
                  id="rfp-flexible-dates"
                  type="checkbox"
                  name="flexibleDates"
                  defaultChecked={inquiry.groupRfp?.flexibleDates ?? false}
                />
                Flexible dates
              </label>
              <Textarea
                name="notes"
                rows={3}
                placeholder="RFP notes"
                aria-label="RFP notes"
                defaultValue={inquiry.groupRfp?.notes ?? ""}
              />
              <Button type="submit" size="sm">Save RFP</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposal</CardTitle>
            <CardDescription>
              Record the hotel&apos;s first proposal response.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inquiry.proposals.length > 0 && (
              <div className="space-y-2">
                {inquiry.proposals.map((proposal) => (
                  <div key={proposal.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary">{titleize(proposal.status)}</Badge>
                      <span className="text-muted-foreground">
                        {proposal.createdByName}
                      </span>
                    </div>
                    <p className="mt-2">
                      Rate: {proposal.roomRateCents ? formatCurrency(proposal.roomRateCents) : "TBD"} ·
                      Total: {proposal.totalEstimateCents ? formatCurrency(proposal.totalEstimateCents) : "TBD"}
                    </p>
                    {proposal.notes && <p className="mt-1 text-muted-foreground">{proposal.notes}</p>}
                  </div>
                ))}
              </div>
            )}
            <form action={createInquiryProposal} className="space-y-3">
              <input type="hidden" name="inquiryId" value={inquiry.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="proposal-room-rate">Room Rate</Label>
                  <Input id="proposal-room-rate" type="number" name="roomRate" min="0" step="1" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposal-total-estimate">Total Estimate</Label>
                  <Input id="proposal-total-estimate" type="number" name="totalEstimate" min="0" step="1" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposal-room-block">Room Block</Label>
                  <Input id="proposal-room-block" type="number" name="roomBlock" min="0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposal-cutoff-date">Cutoff Date</Label>
                  <Input id="proposal-cutoff-date" type="date" name="cutoffDate" />
                </div>
              </div>
              <Input
                name="cancellationTerms"
                placeholder="Cancellation terms"
                aria-label="Cancellation terms"
              />
              <Textarea
                name="notes"
                rows={3}
                placeholder="Proposal notes"
                aria-label="Proposal notes"
              />
              <Button type="submit" size="sm">Create proposal</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const hotels =
    session.role === "ANALYST"
      ? await prisma.hotel.findMany({
          where: { status: "ACTIVE" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.hotel.findMany({
          where: {
            status: "ACTIVE",
            access: { some: { userId: session.sub } },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });

  const inquiries = await getInquiries();
  const selectedId = searchParams.id ?? inquiries[0]?.id;
  const selectedInquiry = selectedId ? await getInquiryDetail(selectedId) : null;
  const showAnalyze = process.env.INQUIRY_UI_ANALYZE !== "false";

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Lead inbox"
        title="Inquiries"
        description="Capture hotel demand, qualify group intent, and prepare RFPs and proposals."
        actions={<Badge variant="outline">{inquiries.length} total</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Inquiry</CardTitle>
          <CardDescription>Manual entry for calls, email, social DMs, or imported leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createManualInquiry} className="grid gap-3 lg:grid-cols-6">
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="new-inquiry-hotel">Hotel</Label>
              <HotelSelect id="new-inquiry-hotel" hotels={hotels} defaultValue={hotels[0]?.id} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-guest">Guest</Label>
              <Input id="new-inquiry-guest" name="guestName" placeholder="Guest name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-email">Email</Label>
              <Input id="new-inquiry-email" name="guestEmail" type="email" placeholder="guest@email.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-intent">Intent</Label>
              <SelectField id="new-inquiry-intent" name="intent" defaultValue="UNKNOWN" options={INTENTS} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-priority">Priority</Label>
              <SelectField id="new-inquiry-priority" name="priority" defaultValue="NORMAL" options={PRIORITIES} />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="new-inquiry-organization">Organization</Label>
              <Input id="new-inquiry-organization" name="organizationName" placeholder="Company, school, planner" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-check-in">Check In</Label>
              <Input id="new-inquiry-check-in" name="checkIn" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-check-out">Check Out</Label>
              <Input id="new-inquiry-check-out" name="checkOut" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-rooms">Rooms</Label>
              <Input id="new-inquiry-rooms" name="roomCount" type="number" min="0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-inquiry-budget">Budget</Label>
              <Input id="new-inquiry-budget" name="budget" type="number" min="0" />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label htmlFor="new-inquiry-summary">Summary</Label>
              <Input id="new-inquiry-summary" name="summary" placeholder="Short lead summary" />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label htmlFor="new-inquiry-initial-message">Initial Message</Label>
              <Input id="new-inquiry-initial-message" name="initialMessage" placeholder="What did the guest ask for?" />
            </div>
            <div className="flex items-end lg:col-span-6">
              <Button type="submit" disabled={hotels.length === 0}>Create inquiry</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No inquiries yet"
              description={
                session.role === "ANALYST"
                  ? "Inquiries are inbound leads — room blocks, weddings, meetings, and offsites. They arrive from the public form at /inquire or can be logged by hand with Add Inquiry above. No active hotel has received one yet."
                  : "Inquiries are inbound leads — room blocks, weddings, meetings, and offsites. They arrive from the public form at /inquire or can be logged by hand with Add Inquiry above. Your hotels have not received one yet."
              }
              action={
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href="/inquire" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Preview the public form
                  </Link>
                </Button>
              }
            />
          ) : (
            inquiries.map((inquiry) => (
              <Link key={inquiry.id} href={`/inquiries?id=${inquiry.id}`}>
                <Card className={selectedId === inquiry.id ? "border-trosky-red" : "hover:border-trosky-red/50"}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {inquiry.guestName || inquiry.organizationName || "Untitled inquiry"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {inquiry.hotelName}
                        </p>
                      </div>
                      <Badge variant={statusVariant(inquiry.status)}>
                        {titleize(inquiry.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {inquiry.summary || titleize(inquiry.intent)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{titleize(inquiry.source)}</Badge>
                      <Badge variant="outline">{titleize(inquiry.intent)}</Badge>
                      <Badge variant={priorityVariant(inquiry.priority)}>
                        {titleize(inquiry.priority)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {selectedInquiry ? (
          <InquiryDetailPanel inquiry={selectedInquiry} showAnalyze={showAnalyze} />
        ) : (
          <EmptyDetail />
        )}
      </div>
    </div>
  );
}
