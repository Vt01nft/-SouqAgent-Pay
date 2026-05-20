import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`SouqAgent Pay API listening on ${config.publicBaseUrl}`);
});
