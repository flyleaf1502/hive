import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = new URL("../dist/index.html", import.meta.url);
const target = new URL("../dist/anmeldung/", import.meta.url);
const html = readFileSync(source, "utf8");
if (!html.includes("<head>") || html.includes("<base ")) throw new Error("Unexpected canonical HTML structure");
mkdirSync(target, { recursive: true });
writeFileSync(new URL("index.html", target), html.replace("<head>", '<head>\n    <base href="../" />'), "utf8");
console.log("Built /anmeldung/ from the canonical dist/index.html.");
