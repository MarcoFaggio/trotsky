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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {titleize(option)}
        </option>
      ))}
    </select>
  );
}

function HotelSelect({
  hotels,
  defaultValue,
}: {
  hotels: { id: string; name: string }[];
  defaultValue: string;
}) {
  return (
    <select
      name="hotelId"
      defaultValue={defaultValue}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      {hotels.map((hotel) => (
        <option key={hotel.id} value={hotel.id}>
          {hotel.name}
        </option>
      ))}
    </select>
  );
}

function EmptyDetail() {
  return (
    <Card>
      <CardContent className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Select an inquiry to qualify the lead, add RFP details, and send a proposal.
        </p>
      </CardContent>
    </Card>
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
              <Label>Status</Label>
              <SelectField name="status" defaultValue={inquiry.status} options={STATUSES} />
            </div>
            <div className="space-y-1">
              <Label>Intent</Label>
              <SelectField name="intent" defaultValue={inquiry.intent} options={INTENTS} />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <SelectField name="priority" defaultValue={inquiry.priority} options={PRIORITIES} />
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
                  <p className="text-sm font-medium">AI Assist</p>
                  <p className="text-xs text-muted-foreground">
                    Classifies intent and extracts missing RFP fields.
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
            <textarea
              name="body"
              rows={3}
              placeholder="Add a staff note or reply context"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <Label>Event Type</Label>
                  <Input name="eventType" defaultValue={inquiry.groupRfp?.eventType ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Decision Date</Label>
                  <Input type="date" name="decisionDate" defaultValue={inquiry.groupRfp?.decisionDate ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Rooms Per Night</Label>
                  <Input type="number" name="roomsPerNight" defaultValue={inquiry.groupRfp?.roomsPerNight ?? ""} />
                </div>
                <div className="space-y-1">
                  <Label>Attendees</Label>
                  <Input type="number" name="attendeeCount" defaultValue={inquiry.groupRfp?.attendeeCount ?? ""} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Meeting Room Setup</Label>
                <Input name="meetingRoomSetup" defaultValue={inquiry.groupRfp?.meetingRoomSetup ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Food & Beverage</Label>
                <Input name="foodAndBeverage" defaultValue={inquiry.groupRfp?.foodAndBeverage ?? ""} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="flexibleDates" defaultChecked={inquiry.groupRfp?.flexibleDates ?? false} />
                Flexible dates
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="RFP notes"
                defaultValue={inquiry.groupRfp?.notes ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm">Save RFP</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposal</CardTitle>
            <CardDescription>Record the hotel's first proposal response.</CardDescription>
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
                  <Label>Room Rate</Label>
                  <Input type="number" name="roomRate" min="0" step="1" />
                </div>
                <div className="space-y-1">
                  <Label>Total Estimate</Label>
                  <Input type="number" name="totalEstimate" min="0" step="1" />
                </div>
                <div className="space-y-1">
                  <Label>Room Block</Label>
                  <Input type="number" name="roomBlock" min="0" />
                </div>
                <div className="space-y-1">
                  <Label>Cutoff Date</Label>
                  <Input type="date" name="cutoffDate" />
                </div>
              </div>
              <Input name="cancellationTerms" placeholder="Cancellation terms" />
              <textarea
                name="notes"
                rows={3}
                placeholder="Proposal notes"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground">
            Capture hotel demand, qualify group intent, and prepare RFPs and proposals.
          </p>
        </div>
        <Badge variant="outline">{inquiries.length} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Inquiry</CardTitle>
          <CardDescription>Manual entry for calls, email, social DMs, or imported leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createManualInquiry} className="grid gap-3 lg:grid-cols-6">
            <div className="space-y-1 lg:col-span-2">
              <Label>Hotel</Label>
              <HotelSelect hotels={hotels} defaultValue={hotels[0]?.id ?? ""} />
            </div>
            <div className="space-y-1">
              <Label>Guest</Label>
              <Input name="guestName" placeholder="Guest name" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input name="guestEmail" type="email" placeholder="guest@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Intent</Label>
              <SelectField name="intent" defaultValue="UNKNOWN" options={INTENTS} />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <SelectField name="priority" defaultValue="NORMAL" options={PRIORITIES} />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label>Organization</Label>
              <Input name="organizationName" placeholder="Company, school, planner" />
            </div>
            <div className="space-y-1">
              <Label>Check In</Label>
              <Input name="checkIn" type="date" />
            </div>
            <div className="space-y-1">
              <Label>Check Out</Label>
              <Input name="checkOut" type="date" />
            </div>
            <div className="space-y-1">
              <Label>Rooms</Label>
              <Input name="roomCount" type="number" min="0" />
            </div>
            <div className="space-y-1">
              <Label>Budget</Label>
              <Input name="budget" type="number" min="0" />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label>Summary</Label>
              <Input name="summary" placeholder="Short lead summary" />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <Label>Initial Message</Label>
              <Input name="initialMessage" placeholder="What did the guest ask for?" />
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
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No inquiries yet.
              </CardContent>
            </Card>
          ) : (
            inquiries.map((inquiry) => (
              <Link key={inquiry.id} href={`/inquiries?id=${inquiry.id}`}>
                <Card className={selectedId === inquiry.id ? "border-primary" : "hover:border-primary/50"}>
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
