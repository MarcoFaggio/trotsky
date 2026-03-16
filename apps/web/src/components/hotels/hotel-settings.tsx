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
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { updateHotel, addCompetitorToHotel, updateHotelCompetitor, removeHotelCompetitor } from "@/actions/hotels";
import { createRatePlan, updateRatePlan } from "@/actions/rate-plans";
import { toast } from "@/hooks/use-toast";
import { weightToLabel } from "@hotel-pricing/shared";
import Link from "next/link";

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
  const [general, setGeneral] = useState({
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

  async function handleSaveGeneral() {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hotels/${hotel.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground">Hotel settings and configuration</p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="competitors">Competitors ({hotel.competitors.length})</TabsTrigger>
          <TabsTrigger value="rateplans">Rate Plans ({hotel.ratePlans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Hotel Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>PMS Name</Label>
                  <Input value={general.pmsName} onChange={(e) => setGeneral({ ...general, pmsName: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={general.phone} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={general.email} onChange={(e) => setGeneral({ ...general, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={general.address} onChange={(e) => setGeneral({ ...general, address: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Room Count</Label>
                  <Input type="number" value={general.roomCount} onChange={(e) => setGeneral({ ...general, roomCount: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Min Rate ($)</Label>
                  <Input type="number" value={general.minRate} onChange={(e) => setGeneral({ ...general, minRate: e.target.value as any })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Rate ($)</Label>
                  <Input type="number" value={general.maxRate} onChange={(e) => setGeneral({ ...general, maxRate: e.target.value as any })} />
                </div>
                <div className="space-y-2">
                  <Label>Occ Target %</Label>
                  <Input type="number" value={general.occTarget} onChange={(e) => setGeneral({ ...general, occTarget: parseFloat(e.target.value) || 75 })} />
                </div>
              </div>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors">
          <Card>
            <CardHeader><CardTitle>Competitor Set</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.25">Low (0.25)</SelectItem>
                              <SelectItem value="0.5">Medium (0.5)</SelectItem>
                              <SelectItem value="0.85">High (0.85)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                          {hc.competitor.listings[0]?.url || "No URL"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveCompetitor(hc.competitorId)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
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
                  <Input placeholder="Competitor name" value={newComp.name} onChange={(e) => setNewComp({ ...newComp, name: e.target.value })} />
                  <Input placeholder="Expedia URL" value={newComp.expediaUrl} onChange={(e) => setNewComp({ ...newComp, expediaUrl: e.target.value })} />
                  <Select value={newComp.weight} onValueChange={(v) => setNewComp({ ...newComp, weight: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.25">Low</SelectItem>
                      <SelectItem value="0.5">Medium</SelectItem>
                      <SelectItem value="0.85">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddCompetitor} disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />Add
                  </Button>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add Rate Plan</h4>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input placeholder="Code (e.g. GOV)" value={newPlan.code} onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value })} />
                  <Input placeholder="Plan name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
                  <Input type="number" placeholder="Discount %" value={newPlan.discountPercent} onChange={(e) => setNewPlan({ ...newPlan, discountPercent: e.target.value })} />
                  <Button onClick={handleAddRatePlan} disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
