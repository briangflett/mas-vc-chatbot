/**
 * Read-only smoke test for the /api/profile route (resolve + get ops).
 * Discovers a real VC from CiviCRM ("Other"-location login email), then drives
 * the actual POST handler end-to-end. Does NOT exercise `save` (writes).
 *
 *   node --env-file=.env.local --import tsx scripts/verify-profile.ts
 */
import { civiApi4 } from "../lib/civicrm";
import { POST } from "../app/api/profile/route";

async function call(payload: Record<string, unknown>) {
  const res = await POST(
    new Request("http://local/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return { status: res.status, json: await res.json() };
}

async function main() {
  // Find a sample VC: any contact with an "Other"-location email (the login email).
  const sample = await civiApi4<Record<string, unknown>>("Email", "get", {
    select: ["contact_id", "email"],
    where: [["location_type_id:name", "=", "Other"]],
    limit: 1,
  });
  if (!sample[0]) throw new Error("no 'Other'-location email found to test with");
  const loginEmail = String(sample[0].email);
  console.log(`[sample] login email: ${loginEmail} (contact ${sample[0].contact_id})`);

  // resolve
  const resolved = await call({ op: "resolve", wp_username: loginEmail });
  console.log(`[resolve] ${resolved.status}`, JSON.stringify(resolved.json));
  const cid = (resolved.json as { contact_id?: number }).contact_id;
  if (!cid) throw new Error("resolve did not return a contact_id");

  // get
  const got = await call({ op: "get", contact_id: cid });
  console.log(`[get] ${got.status}`, JSON.stringify(got.json));

  console.log("\n[ok] resolve + get round-trip succeeded against live CiviCRM");
  process.exit(0);
}

main().catch((err) => {
  console.error("[fail]", err instanceof Error ? err.message : err);
  process.exit(1);
});
