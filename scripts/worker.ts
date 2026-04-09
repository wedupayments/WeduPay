import { workerService } from "@/services/worker.service";
import * as dotenv from "dotenv";

// Load env vars if starting independently
dotenv.config();
dotenv.config({ path: ".env.local" });

console.log("Starting WeduPay Worker Process...");

const cleanup = () => {
  console.log("\nStopping worker process gracefully...");
  workerService.stop();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function main() {
  try {
    // Start background processing loop
    await workerService.start();
  } catch (error) {
    console.error("Fatal error in worker:", error);
    process.exit(1);
  }
}

main();
