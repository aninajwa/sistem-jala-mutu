import { logger } from "./lib/logger";
import { validateSupabaseConfiguration } from "./config/supabase";

// Validate QA isolation before loading application modules or opening the
// HTTP listener. This check never logs credentials and does not constrain
// separate production environments.
validateSupabaseConfiguration();

// Load routes only after the QA configuration is known to be safe.
const { default: app } = await import("./app");

const rawPort = process.env["PORT"] ?? "5000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
