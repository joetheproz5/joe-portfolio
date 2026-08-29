import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = "public/yalout";
const indexPath = join(root, "index.html");
const entryPath = join(root, "_expo/static/js/web/entry-4ddc8ed4595b45285caecbc25e409753.js");
const assetPrefix = process.env.GITHUB_ACTIONS ? "/joe-portfolio/yalout/" : "/yalout/";

async function rewrite(path, transform) {
  const source = await readFile(path, "utf8");
  const output = transform(source);
  if (output !== source) await writeFile(path, output);
}

// Expo's static export targets a site root. Give its assets an explicit prefix
// so client-side navigation can still use / as the app's route root.
await rewrite(indexPath, (source) => {
  const routeRootScript = '<script>history.replaceState(null, "", "/");</script>';
  const cleanHead = source
    .replace(/<base href="\.\/"><script>[\s\S]*?<\/script>/g, '')
    .replace(/<head>(?:<script>history\.replaceState\(null, "", "\/"\);<\/script>)+/, `<head>${routeRootScript}`);
  const withRouteRoot = cleanHead.includes(routeRootScript)
    ? cleanHead
    : cleanHead.replace('<head>', `<head>${routeRootScript}`);

  return withRouteRoot
    .replaceAll('href="/assets/', `href="${assetPrefix}assets/`)
    .replaceAll('href="./assets/', `href="${assetPrefix}assets/`)
    .replaceAll('src="/_expo/', `src="${assetPrefix}_expo/`)
    .replaceAll('src="./_expo/', `src="${assetPrefix}_expo/`)
    .replaceAll('href="/favicon.ico"', `href="${assetPrefix}favicon.ico"`)
    .replaceAll('href="./favicon.ico"', `href="${assetPrefix}favicon.ico"`)
    .replaceAll('url("/assets/', `url("${assetPrefix}assets/`)
    .replaceAll('url("./assets/', `url("${assetPrefix}assets/`);
});

await rewrite(entryPath, (source) => source
  .replaceAll('"/assets/', `"${assetPrefix}assets/`)
  .replaceAll('"./assets/', `"${assetPrefix}assets/`));
