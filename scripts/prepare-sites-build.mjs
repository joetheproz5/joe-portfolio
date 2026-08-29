import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const source = "out";
const target = "dist";

try {
  await stat(source);
} catch {
  throw new Error("Next.js static export was not generated.");
}

await rm(target, { recursive: true, force: true });
await mkdir(join(target, "server"), { recursive: true });
await cp(source, join(target, "client"), { recursive: true });
await writeFile(
  join(target, "server", "index.js"),
  "export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n",
);
