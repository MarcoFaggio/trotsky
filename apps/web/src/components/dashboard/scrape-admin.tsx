"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScrapeRun {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  mode: string;
  summaryJson: any;
  _count: { errors: number; rates: number };
}

interface ScrapeAdminProps {
  runs: ScrapeRun[];
}

export function ScrapeAdmin({ runs }: ScrapeAdminProps) {
  const [triggering, setTriggering] = useState(false);

  async function handleRunNow() {
    setTriggering(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Scrape job queued", description: `Job ID: ${data.jobId}` });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scrape Administration</h1>
          <p className="text-muted-foreground">Monitor and trigger scraping jobs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunNow} disabled={triggering}>
            <Play className="mr-2 h-4 w-4" />
            {triggering ? "Queuing..." : "Run Scrape Now"}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scrape Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Started</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Mode</th>
                  <th className="px-4 py-2 text-right">Rates</th>
                  <th className="px-4 py-2 text-right">Errors</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const duration = run.finishedAt
                    ? Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                    : null;
                  const summary = run.summaryJson as any;
                  return (
                    <tr key={run.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{run.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2">{new Date(run.startedAt).toLocaleString()}</td>
                      <td className="px-4 py-2">{duration ? `${duration}s` : "—"}</td>
                      <td className="px-4 py-2">
                        <Badge variant={
                          run.status === "COMPLETED" ? "success" :
                          run.status === "FAILED" ? "destructive" :
                          run.status === "RUNNING" ? "default" : "secondary"
                        }>
                          {run.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{run.mode}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{summary?.ratesStored ?? run._count.rates}</td>
                      <td className="px-4 py-2 text-right">{run._count.errors > 0 ? (
                        <span className="text-destructive font-medium">{run._count.errors}</span>
                      ) : "0"}</td>
                    </tr>
                  );
                })}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No scrape runs yet. Click "Run Scrape Now" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
