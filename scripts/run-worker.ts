import { workerService } from "../src/services/worker.service";

async function main() {
  console.log("Starting WeduPay background worker...");
  
  // Handle termination
  process.on("SIGINT", () => {
    console.log("Stopping worker...");
    workerService.stop();
    process.exit(0);
  });

  await workerService.start();
}

main().catch(err => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
