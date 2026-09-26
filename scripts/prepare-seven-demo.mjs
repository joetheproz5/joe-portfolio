import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const sourceRoot = "Web/";
const outputRoot = "public/seven";
const ignored = ["Web/server.js", "Web/downloads/", ".local.", ".sql", ".example.json"];

const treeResponse = await fetch("https://api.github.com/repos/joetheproz5/cineva/git/trees/master?recursive=1", {
  headers: { "User-Agent": "joe-portfolio-build" },
});
if (!treeResponse.ok) throw new Error(`Could not fetch the SEVEN source list (${treeResponse.status}).`);

const tree = await treeResponse.json();
const files = tree.tree.filter((entry) => entry.type === "blob" && entry.path.startsWith(sourceRoot) && !ignored.some((pattern) => entry.path.includes(pattern)));

function rewrite(filePath, content) {
  if (filePath.endsWith("index.html")) return content.replaceAll('="/', '="./').replaceAll("='/", "='./");
  if (filePath.endsWith(".css")) return content.replaceAll("url('/", "url('./").replaceAll('url("/', 'url("./');
  if (filePath.endsWith("app.js")) return content
    .replaceAll('"/assets/', '"./assets/')
    .replaceAll('"/icon.svg"', '"./icon.svg"')
    .replaceAll('"/service-worker.js', '"./service-worker.js')
    .replaceAll('"/api/', '"./api/')
    .replaceAll('`/api/', '`./api/');
  if (filePath.endsWith(".webmanifest")) return content.replaceAll('"/', '"./');
  return content;
}

await rm(outputRoot, { recursive: true, force: true });
await Promise.all(files.map(async (file) => {
  const destination = join(outputRoot, file.path.slice(sourceRoot.length));
  const response = await fetch(`https://raw.githubusercontent.com/joetheproz5/cineva/master/${file.path}`);
  if (!response.ok) throw new Error(`Could not fetch ${file.path} (${response.status}).`);
  const data = new Uint8Array(await response.arrayBuffer());
  await mkdir(dirname(destination), { recursive: true });
  const textFile = /\.(html|js|css|webmanifest)$/i.test(destination);
  await writeFile(destination, textFile ? rewrite(destination, new TextDecoder().decode(data)) : data);
}));
