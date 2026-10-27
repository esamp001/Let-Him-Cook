import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Ollama model: ${env.ollamaModel}`);
  console.log(`Let Him Cook API listening on http://localhost:${env.port}`);
});
