"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { createPromotion, deletePromotion } from "@/actions/occupancy";
import { toast } from "@/hooks/use-toast";

interface Promotion {
  id: string;
  hotelId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  terms: string | null;
  hotel: { name: string };
}

interface PromotionsListProps {
  promotions: Promotion[];
  hotels: { id: string; name: string }[];
}

export function PromotionsList({ promotions: initialPromos, hotels }: PromotionsListProps) {
  const [promotions, setPromotions] = useState(initialPromos);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    hotelId: hotels[0]?.id || "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    terms: "",
  });

  async function handleCreate() {
    if (!form.title || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await createPromotion(form);
      toast({ title: "Promotion created" });
      setOpen(false);
      setForm({ hotelId: hotels[0]?.id || "", title: "", description: "", startDate: "", endDate: "", terms: "" });
      window.location.reload();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePromotion(id);
      setPromotions((p) => p.filter((pr) => pr.id !== id));
      toast({ title: "Promotion deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Manage hotel promotions and special offers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Promotion</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hotel</Label>
                <Select value={form.hotelId} onValueChange={(v) => setForm({ ...form, hotelId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {hotels.map((h) => (<SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Terms</Label>
                <Input value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create Promotion"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {promotions.map((p) => {
          const isActive = new Date(p.startDate) <= today && new Date(p.endDate) >= today;
          return (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.title}</span>
                    <Badge variant={isActive ? "success" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.hotel.name} | {new Date(p.startDate).toLocaleDateString()} — {new Date(p.endDate).toLocaleDateString()}
                  </p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {promotions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No promotions yet. Create your first promotion.
          </div>
        )}
      </div>
    </div>
  );
}
