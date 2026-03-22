import app from "./app";
import { env } from "./config/env.config";

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});
