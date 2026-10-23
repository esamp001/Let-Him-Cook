import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Let Him Cook API listening on http://localhost:${env.port}`);
});
