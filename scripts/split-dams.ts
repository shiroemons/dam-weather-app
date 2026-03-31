import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = resolve(__dirname, "../src/data/dams.json");
const outputDir = resolve(__dirname, "../public/data/dams");

const dams = JSON.parse(readFileSync(inputPath, "utf-8")) as Array<{ prefectureSlug: string }>;

const grouped = new Map<string, unknown[]>();
for (const dam of dams) {
  const slug = dam.prefectureSlug;
  if (!grouped.has(slug)) grouped.set(slug, []);
  grouped.get(slug)!.push(dam);
}

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

for (const [slug, prefDams] of grouped) {
  writeFileSync(resolve(outputDir, `${slug}.json`), JSON.stringify(prefDams));
}

console.log(`Generated ${grouped.size} prefecture dam files in ${outputDir}`);
for (const [slug, prefDams] of grouped) {
  console.log(`  ${slug}: ${prefDams.length} dams`);
}
