import { generateInvoicePdf } from "../src/lib/invoice";
import fs from "fs";
import path from "path";

async function main() {
  const pdf = await generateInvoicePdf({
    number: "NDGYS/2026/C-S26Q",
    issuedAt: new Date("2026-06-13T12:00:00Z"),
    delegateId: "NDGYS-C-2026-S26Q",
    fullName: "Harsh Saini",
    email: "harsh@example.com",
    trackName: "Battle of Bands",
    amount: 400.0,
    itemTitle: "Competition Registration — Battle of Bands",
    portfolio: "Portfolio Preference 1 / United Nations Security Council"
  });

  const outPath = path.join(__dirname, "sample_invoice.pdf");
  fs.writeFileSync(outPath, pdf);
  console.log(`Successfully generated sample PDF at: ${outPath}`);
}

main().catch(console.error);
