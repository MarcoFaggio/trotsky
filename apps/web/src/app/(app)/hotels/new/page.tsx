"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHotel } from "@/actions/hotels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function NewHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
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
      <div>
        <h1 className="text-2xl font-bold">Add New Hotel</h1>
        <p className="text-muted-foreground">Enter hotel details to create a new property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hotel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name *</Label>
                <Input id="name" name="name" required placeholder="Comfort Inn Atlanta" />
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
                <Input id="roomCount" name="roomCount" type="number" defaultValue={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue="America/New_York" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occTarget">Occupancy Target %</Label>
                <Input id="occTarget" name="occTarget" type="number" defaultValue={75} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minRate">Min Rate ($)</Label>
                <Input id="minRate" name="minRate" type="number" placeholder="65" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRate">Max Rate ($)</Label>
                <Input id="maxRate" name="maxRate" type="number" placeholder="250" />
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
