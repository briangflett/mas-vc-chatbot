/**
 * Idempotent write-path smoke test for the /api/profile `save` op.
 * Targets contact 2 (Brian's own record) ONLY: reads current values, saves them
 * back UNCHANGED, then re-reads and asserts equality. Net-zero data change.
 *
 *   node --env-file=.env.local --import tsx scripts/verify-profile-save.ts
 */
import { POST } from "../app/api/profile/route";

const CID = 2; // Brian's own contact — safe, idempotent target

async function call(payload: Record<string, unknown>) {
  const res = await POST(
    new Request("http://local/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return (await res.json()) as Record<string, unknown>;
}

async function main() {
  const before = await call({ op: "get", contact_id: CID });
  if (!before.success) throw new Error("initial get failed");

  const saveRes = await call({
    op: "save",
    contact_id: CID,
    email: before.email,
    primary_expertise: before.primary_expertise,
    areas_of_expertise: before.areas_of_expertise,
    skills: before.skills,
    share_email: before.share_email,
  });
  if (!saveRes.success) throw new Error("save failed: " + JSON.stringify(saveRes));

  const after = await call({ op: "get", contact_id: CID });
  const fields = ["email", "primary_expertise", "skills", "share_email"] as const;
  const areasEqual =
    JSON.stringify(before.areas_of_expertise) === JSON.stringify(after.areas_of_expertise);
  const scalarsEqual = fields.every((f) => JSON.stringify(before[f]) === JSON.stringify(after[f]));

  console.log("[save]", JSON.stringify(saveRes));
  console.log("[after]", JSON.stringify({ ...after, email: "<email>" }));
  if (areasEqual && scalarsEqual) {
    console.log("\n[ok] save round-trip is idempotent — all fields unchanged");
    process.exit(0);
  }
  console.error("\n[fail] values changed after idempotent save");
  process.exit(1);
}

main().catch((err) => {
  console.error("[fail]", err instanceof Error ? err.message : err);
  process.exit(1);
});
