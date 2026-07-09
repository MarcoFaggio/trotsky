"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHotel } from "@/actions/hotels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { toast } from "@/hooks/use-toast";

type FieldErrors = Partial<Record<string, string>>;

function numericValue(formData: FormData, key: string): number | null {
  const value = String(formData.get(key) || "").trim();
  return value === "" ? null : Number(value);
}

function validateHotelForm(formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = String(formData.get("name") || "").trim();
  const roomCount = numericValue(formData, "roomCount");
  const occTarget = numericValue(formData, "occTarget");
  const minRate = numericValue(formData, "minRate");
  const maxRate = numericValue(formData, "maxRate");

  if (!name) errors.name = "Hotel name is required.";
  if (roomCount !== null && (!Number.isInteger(roomCount) || roomCount <= 0)) {
    errors.roomCount = "Room count must be a whole number greater than 0.";
  }
  if (occTarget !== null && (occTarget < 0 || occTarget > 100)) {
    errors.occTarget = "Occupancy target must be between 0 and 100.";
  }
  if (minRate !== null && (!Number.isFinite(minRate) || minRate <= 0)) {
    errors.minRate = "Minimum rate must be greater than 0.";
  }
  if (maxRate !== null && (!Number.isFinite(maxRate) || maxRate <= 0)) {
    errors.maxRate = "Maximum rate must be greater than 0.";
  }
  if (minRate !== null && maxRate !== null && minRate > maxRate) {
    errors.maxRate = "Maximum rate must be higher than the minimum rate.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function NewHotelForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextErrors = validateHotelForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast({
        title: "Check hotel details",
        description: "Fix the highlighted fields before creating the hotel.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const hotel = await createHotel(formData);
      toast({ title: "Hotel created successfully" });
      router.push(`/hotels/${hotel.id}/settings`);
    } catch (err: any) {
      toast({ title: "Error creating hotel", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <TroskyPageHeader
        eyebrow="Portfolio"
        title="Add New Hotel"
        description="Enter hotel details to create a new property."
        className="mb-0 sm:mb-0 lg:mb-0"
      />

      <Card>
        <CardHeader>
          <CardTitle>Hotel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            onChange={(e) => setErrors(validateHotelForm(new FormData(e.currentTarget)))}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Comfort Inn Atlanta"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                <div id="name-error"><FieldError message={errors.name} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmsName">PMS Name</Label>
                <Input id="pmsName" name="pmsName" placeholder="CI ATL" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+1-404-555-0123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="gm@hotel.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="123 Main St, City, State" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="roomCount">Room Count</Label>
                <Input
                  id="roomCount"
                  name="roomCount"
                  type="number"
                  defaultValue={100}
                  min={1}
                  step={1}
                  aria-invalid={Boolean(errors.roomCount)}
                  aria-describedby={errors.roomCount ? "roomCount-error" : undefined}
                />
                <div id="roomCount-error"><FieldError message={errors.roomCount} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue="America/New_York" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occTarget">Occupancy Target %</Label>
                <Input
                  id="occTarget"
                  name="occTarget"
                  type="number"
                  defaultValue={75}
                  min={0}
                  max={100}
                  aria-invalid={Boolean(errors.occTarget)}
                  aria-describedby={errors.occTarget ? "occTarget-error" : undefined}
                />
                <div id="occTarget-error"><FieldError message={errors.occTarget} /></div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minRate">Min Rate ($)</Label>
                <Input
                  id="minRate"
                  name="minRate"
                  type="number"
                  min={1}
                  placeholder="65"
                  aria-invalid={Boolean(errors.minRate)}
                  aria-describedby={errors.minRate ? "minRate-error" : undefined}
                />
                <div id="minRate-error"><FieldError message={errors.minRate} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRate">Max Rate ($)</Label>
                <Input
                  id="maxRate"
                  name="maxRate"
                  type="number"
                  min={1}
                  placeholder="250"
                  aria-invalid={Boolean(errors.maxRate)}
                  aria-describedby={errors.maxRate ? "maxRate-error" : undefined}
                />
                <div id="maxRate-error"><FieldError message={errors.maxRate} /></div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium">OTA Listings</h3>
              <div className="space-y-2">
                <Label htmlFor="expediaUrl">Expedia URL</Label>
                <Input id="expediaUrl" name="expediaUrl" placeholder="https://www.expedia.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingUrl">Booking.com URL (optional)</Label>
                <Input id="bookingUrl" name="bookingUrl" placeholder="https://www.booking.com/..." />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Hotel"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
