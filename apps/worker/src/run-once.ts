import { dailyScrapeProcessor } from "./jobs/daily-scrape";
import { recomputeRecommendationsProcessor } from "./jobs/recompute-recommendations";
import { assertHostedWriteIsSafe } from "./lib/production-guard";
import { refreshStaleOccupancyAndEvents } from "./services/horizon-refresh";

async function main() {
  assertHostedWriteIsSafe("run scrape + recompute");

  console.log("Refreshing occupancy/event horizon if stale...");
  const horizon = await refreshStaleOccupancyAndEvents();
  console.log(
    `Horizon: ${horizon.occupancyUpserted} occupancy rows, ${horizon.eventsShifted} events shifted`
  );

  console.log("Running scrape (no Redis)...");
  const scrape = await dailyScrapeProcessor({ trigger: "run-once" });
  console.log(
    `Scrape complete. Hotels: ${scrape.affectedHotelIds.join(", ") || "(none)"}`
  );

  console.log("Recomputing recommendations and live revenue actions...");
  await recomputeRecommendationsProcessor({});
  console.log("Recompute complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
