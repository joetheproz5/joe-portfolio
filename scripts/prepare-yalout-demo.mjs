import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = "public/yalout";
const indexPath = join(root, "index.html");
const entryPath = join(root, "_expo/static/js/web/entry-4ddc8ed4595b45285caecbc25e409753.js");

async function rewrite(path, transform) {
  const source = await readFile(path, "utf8");
  const output = transform(source);
  if (output !== source) await writeFile(path, output);
}

// Expo's static export targets a site root. These rewrites let it live inside
// the portfolio's /yalout directory on GitHub Pages without changing the app.
await rewrite(indexPath, (source) => source
  .replace('<head>', '<head><base href="./"><script>history.replaceState(null, "", "/");</script>')
  .replaceAll('href="/assets/', 'href="./assets/')
  .replaceAll('src="/_expo/', 'src="./_expo/')
  .replaceAll('href="/favicon.ico"', 'href="./favicon.ico"')
  .replaceAll('url("/assets/', 'url("./assets/'));

await rewrite(entryPath, (source) => source.replaceAll('"/assets/', '"./assets/'));
