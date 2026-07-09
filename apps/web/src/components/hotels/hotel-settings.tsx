"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, ExternalLink } from "lucide-react";
import { updateHotel, addCompetitorToHotel, updateHotelCompetitor, removeHotelCompetitor } from "@/actions/hotels";
import { createRatePlan, updateRatePlan } from "@/actions/rate-plans";
import { toast } from "@/hooks/use-toast";
import { COMPETITOR_WEIGHT_OPTIONS } from "@hotel-pricing/shared";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import Link from "next/link";

type GeneralForm = {
  name: string;
  pmsName: string;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  roomCount: number;
  minRate: number | string;
  maxRate: number | string;
  occTarget: number;
};

function validateGeneralHotel(general: GeneralForm) {
  const errors: string[] = [];
  const minRate = general.minRate === "" ? null : Number(general.minRate);
  const maxRate = general.maxRate === "" ? null : Number(general.maxRate);

  if (!general.name.trim()) errors.push("Hotel name is required.");
  if (!Number.isInteger(general.roomCount) || general.roomCount <= 0) {
    errors.push("Room count must be a whole number greater than 0.");
  }
  if (general.occTarget < 0 || general.occTarget > 100) {
    errors.push("Occupancy target must be between 0 and 100.");
  }
  if (minRate !== null && (!Number.isFinite(minRate) || minRate <= 0)) {
    errors.push("Minimum rate must be greater than 0.");
  }
  if (maxRate !== null && (!Number.isFinite(maxRate) || maxRate <= 0)) {
    errors.push("Maximum rate must be greater than 0.");
  }
  if (minRate !== null && maxRate !== null && minRate > maxRate) {
    errors.push("Maximum rate must be higher than the minimum rate.");
  }

  return errors;
}

interface HotelSettingsProps {
  hotel: {
    id: string;
    name: string;
    pmsName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    timezone: string;
    roomCount: number;
    status: string;
    minRate: number | null;
    maxRate: number | null;
    occTarget: number | null;
    listings: { id: string; ota: string; url: string; active: boolean }[];
    competitors: {
      id: string;
      competitorId: string;
      weight: number;
      active: boolean;
      competitor: {
        id: string;
        name: string;
        listings: { id: string; ota: string; url: string }[];
      };
    }[];
    ratePlans: {
      id: string;
      code: string;
      name: string;
      discountPercent: number;
      active: boolean;
    }[];
  };
}

export function HotelSettings({ hotel }: HotelSettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // General form
  const [general, setGeneral] = useState<GeneralForm>({
    name: hotel.name,
    pmsName: hotel.pmsName || "",
    phone: hotel.phone || "",
    email: hotel.email || "",
    address: hotel.address || "",
    timezone: hotel.timezone,
    roomCount: hotel.roomCount,
    minRate: hotel.minRate ? hotel.minRate / 100 : "",
    maxRate: hotel.maxRate ? hotel.maxRate / 100 : "",
    occTarget: hotel.occTarget || 75,
  });

  // Competitor form
  const [newComp, setNewComp] = useState({ name: "", expediaUrl: "", weight: "0.5" });

  // Rate plan form
  const [newPlan, setNewPlan] = useState({ code: "", name: "", discountPercent: "0" });
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);
  const generalErrors = validateGeneralHotel(general);

  async function handleSaveGeneral() {
    if (generalErrors.length > 0) {
      toast({
        title: "Check hotel details",
        description: "Fix the highlighted values before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateHotel({
        id: hotel.id,
        name: general.name,
        pmsName: general.pmsName || undefined,
        phone: general.phone || undefined,
        email: general.email || undefined,
        address: general.address || undefined,
        timezone: general.timezone,
        roomCount: general.roomCount,
        minRate: general.minRate ? Number(general.minRate) * 100 : null,
        maxRate: general.maxRate ? Number(general.maxRate) * 100 : null,
        occTarget: general.occTarget,
      });
      toast({ title: "Hotel updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCompetitor() {
    if (!newComp.name || !newComp.expediaUrl) return;
    setSaving(true);
    try {
      await addCompetitorToHotel({
        hotelId: hotel.id,
        name: newComp.name,
        expediaUrl: newComp.expediaUrl,
        weight: parseFloat(newComp.weight),
      });
      toast({ title: "Competitor added" });
      setNewComp({ name: "", expediaUrl: "", weight: "0.5" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateWeight(competitorId: string, weight: string) {
    try {
      await updateHotelCompetitor({ hotelId: hotel.id, competitorId, weight: parseFloat(weight) });
      toast({ title: "Weight updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleRemoveCompetitor(competitorId: string) {
    try {
      await removeHotelCompetitor(hotel.id, competitorId);
      toast({ title: "Competitor removed" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleAddRatePlan() {
    if (!newPlan.code || !newPlan.name) return;
    setSaving(true);
    try {
      await createRatePlan({
        hotelId: hotel.id,
        code: newPlan.code,
        name: newPlan.name,
        discountPercent: parseFloat(newPlan.discountPercent),
      });
      toast({ title: "Rate plan created" });
      setNewPlan({ code: "", name: "", discountPercent: "0" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRatePlan(plan: { id: string; name: string; active: boolean }) {
    setTogglingPlanId(plan.id);
    try {
      await updateRatePlan({ id: plan.id, active: !plan.active });
      toast({ title: plan.active ? "Rate plan deactivated" : "Rate plan activated" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTogglingPlanId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button asChild variant="ghost" size="icon" className="mb-2">
          <Link href={`/hotels/${hotel.id}`} aria-label="Back to hotel dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <TroskyPageHeader
          eyebrow="Portfolio"
          title={hotel.name}
          description="Hotel settings and configuration"
        />
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="competitors">Competitors ({hotel.competitors.length})</TabsTrigger>
          <TabsTrigger value="rateplans">Rate Plans ({hotel.ratePlans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Hotel Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Name</Label>
                  <Input id="hotel-name" value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-pms-name">PMS Name</Label>
                  <Input id="hotel-pms-name" value={general.pmsName} onChange={(e) => setGeneral({ ...general, pmsName: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel-phone">Phone</Label>
                  <Input id="hotel-phone" value={general.phone} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-email">Email</Label>
                  <Input id="hotel-email" value={general.email} onChange={(e) => setGeneral({ ...general, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotel-address">Address</Label>
                <Input id="hotel-address" value={general.address} onChange={(e) => setGeneral({ ...general, address: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-room-count">Room Count</Label>
                  <Input
                    id="hotel-room-count"
                    type="number"
                    value={general.roomCount}
                    min={1}
                    step={1}
                    aria-invalid={!Number.isInteger(general.roomCount) || general.roomCount <= 0}
                    onChange={(e) => setGeneral({ ...general, roomCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-min-rate">Min Rate ($)</Label>
                  <Input
                    id="hotel-min-rate"
                    type="number"
                    value={general.minRate}
                    min={1}
                    aria-invalid={general.minRate !== "" && Number(general.minRate) <= 0}
                    onChange={(e) => setGeneral({ ...general, minRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-max-rate">Max Rate ($)</Label>
                  <Input
                    id="hotel-max-rate"
                    type="number"
                    value={general.maxRate}
                    min={1}
                    aria-invalid={
                      general.maxRate !== "" &&
                      (Number(general.maxRate) <= 0 ||
                        (general.minRate !== "" &&
                          Number(general.minRate) > Number(general.maxRate)))
                    }
                    onChange={(e) => setGeneral({ ...general, maxRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-occ-target">Occ Target %</Label>
                  <Input
                    id="hotel-occ-target"
                    type="number"
                    value={general.occTarget}
                    min={0}
                    max={100}
                    aria-invalid={general.occTarget < 0 || general.occTarget > 100}
                    onChange={(e) => setGeneral({ ...general, occTarget: parseFloat(e.target.value) || 75 })}
                  />
                </div>
              </div>
              {generalErrors.length > 0 && (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {generalErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
              <Button onClick={handleSaveGeneral} disabled={saving || generalErrors.length > 0}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>OTA Listings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Listings are set when the hotel is created and can&apos;t be edited here.
              </p>
              {hotel.listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No OTA listings connected.</p>
              ) : (
                <ul className="space-y-2">
                  {hotel.listings.map((listing) => (
                    <li key={listing.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium">{listing.ota}</p>
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                          {listing.url}
                          <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden />
                        </a>
                      </div>
                      <Badge variant={listing.active ? "success" : "secondary"}>
                        {listing.active ? "Active" : "Inactive"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors">
          <Card>
            <CardHeader><CardTitle>Competitor Set</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Weight controls how strongly each competitor influences recommendations:{" "}
                {COMPETITOR_WEIGHT_OPTIONS.map((option) => `${option.label} means ${option.description.toLowerCase()}`).join("; ")}.
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Weight</th>
                      <th className="px-4 py-2 text-left">Expedia URL</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotel.competitors.map((hc) => (
                      <tr key={hc.id} className="border-b">
                        <td className="px-4 py-2">{hc.competitor.name}</td>
                        <td className="px-4 py-2">
                          <Select defaultValue={hc.weight.toString()} onValueChange={(v) => handleUpdateWeight(hc.competitorId, v)}>
                            <SelectTrigger className="w-[120px] h-8" aria-label={`Weight for ${hc.competitor.name}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPETITOR_WEIGHT_OPTIONS.map((option) => (
                                <SelectItem key={option.label} value={String(option.value)}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                          {hc.competitor.listings[0]?.url || "No URL"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Remove ${hc.competitor.name}`}
                            onClick={() => handleRemoveCompetitor(hc.competitorId)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add Competitor</h4>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-competitor-name">Name</Label>
                    <Input id="new-competitor-name" placeholder="Competitor name" value={newComp.name} onChange={(e) => setNewComp({ ...newComp, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-competitor-url">Expedia URL</Label>
                    <Input id="new-competitor-url" placeholder="https://www.expedia.com/..." value={newComp.expediaUrl} onChange={(e) => setNewComp({ ...newComp, expediaUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-competitor-weight">Weight</Label>
                    <Select value={newComp.weight} onValueChange={(v) => setNewComp({ ...newComp, weight: v })}>
                      <SelectTrigger id="new-competitor-weight"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMPETITOR_WEIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.label} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddCompetitor} disabled={saving} className="w-full">
                      <Plus className="mr-2 h-4 w-4" aria-hidden />Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rateplans">
          <Card>
            <CardHeader><CardTitle>Rate Plans</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-right">Discount %</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotel.ratePlans.map((plan) => (
                      <tr key={plan.id} className="border-b">
                        <td className="px-4 py-2 font-mono">{plan.code}</td>
                        <td className="px-4 py-2">{plan.name}</td>
                        <td className="px-4 py-2 text-right">{plan.discountPercent}%</td>
                        <td className="px-4 py-2 text-center">
                          <Badge variant={plan.active ? "success" : "secondary"}>
                            {plan.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            aria-label={`${plan.active ? "Deactivate" : "Activate"} ${plan.name}`}
                            disabled={togglingPlanId === plan.id}
                            onClick={() => handleToggleRatePlan(plan)}
                          >
                            {togglingPlanId === plan.id ? "Saving..." : plan.active ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add Rate Plan</h4>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-plan-code">Code</Label>
                    <Input id="new-plan-code" placeholder="e.g. GOV" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-plan-name">Name</Label>
                    <Input id="new-plan-name" placeholder="Plan name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-plan-discount">Discount %</Label>
                    <Input id="new-plan-discount" type="number" min={0} max={100} value={newPlan.discountPercent} onChange={(e) => setNewPlan({ ...newPlan, discountPercent: e.target.value })} />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddRatePlan} disabled={saving} className="w-full">
                      <Plus className="mr-2 h-4 w-4" aria-hidden />Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
