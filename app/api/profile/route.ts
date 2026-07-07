import { civiApi4, CiviError } from "@/lib/civicrm";

// VC self-service profile endpoint — replaces the n8n `vc-update-profile`
// webhook (ID 5OarmqbQLcSJa6zU). Ported 1:1 from its Code nodes:
//   resolve → Email.get (login email in the "Other" location) → contact_id
//   get     → Contact.get (primary email + MAS_Rep.* custom fields)
//   save    → Email.update (is_primary) then Contact.update (custom fields)
//
// Called cross-origin from the WP "Update your info" widget
// (widgets/vcportal-update-widget.html), so it carries the same CORS handling
// as the chat/feedback routes. Runs on the Node runtime for the CiviCRM fetch.
//
// Trust model matches the n8n original: the caller supplies contact_id (which
// the widget obtains from the WP-authenticated user, either the cached
// civicrm_contact_id or the resolve op). Queries run with checkPermissions:false
// via the service account. See the security note in the PR — hardening the save
// path to re-resolve contact_id server-side is a follow-up, deliberately kept
// out of this parity port.
export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "https://www.masadvise.org";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/** Mirrors the n8n `Normalize Body` node. */
interface ProfileBody {
  op: string;
  wp_user_id: number | null;
  wp_username: string | null;
  contact_id: number | null;
  email: string | null;
  primary_expertise: string | null;
  areas_of_expertise: string[];
  skills: string | null;
  share_email: 0 | 1;
}

function normalize(b: Record<string, unknown>): ProfileBody {
  const s = (v: unknown) => (v != null ? String(v) : null);
  const truthy = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";
  return {
    op: String(b.op ?? "").toLowerCase(),
    wp_user_id: b.wp_user_id != null ? parseInt(String(b.wp_user_id), 10) : null,
    wp_username: b.wp_username ? String(b.wp_username).trim().toLowerCase() : null,
    contact_id: b.contact_id != null ? parseInt(String(b.contact_id), 10) : null,
    email: b.email ? String(b.email).trim() : null,
    primary_expertise: b.primary_expertise ? String(b.primary_expertise).trim() : null,
    areas_of_expertise: Array.isArray(b.areas_of_expertise) ? b.areas_of_expertise.map(String) : [],
    skills: s(b.skills),
    share_email: truthy(b.share_email) ? 1 : 0,
  };
}

// --- op handlers (each returns the widget-facing JSON payload) ---

async function opResolve(body: ProfileBody): Promise<unknown> {
  const username = body.wp_username ?? "";
  const rows = await civiApi4<Record<string, unknown>>("Email", "get", {
    select: ["id", "contact_id", "email", "location_type_id:name"],
    where: [
      ["email", "=", username],
      ["location_type_id:name", "=", "Other"],
    ],
    limit: 1,
  });
  const row = rows[0] ?? null;
  return {
    op: "resolve",
    success: !!row,
    contact_id: row ? parseInt(String(row.contact_id), 10) : null,
    email: row ? row.email : null,
  };
}

async function opGet(body: ProfileBody): Promise<unknown> {
  const rows = await civiApi4<Record<string, unknown>>("Contact", "get", {
    select: [
      "id",
      "display_name",
      "email_primary.email",
      "MAS_Rep.Primary_Area_of_Expertise",
      "MAS_Rep.Areas_of_Expertise",
      "MAS_Rep.Skills",
      "MAS_Rep.Share_Email_with_VC_s",
    ],
    where: [["id", "=", body.contact_id]],
    limit: 1,
  });
  const r = rows[0] ?? null;
  if (!r) return { op: "get", success: false, error: "contact_not_found" };

  const areas = r["MAS_Rep.Areas_of_Expertise"];
  return {
    op: "get",
    success: true,
    contact_id: parseInt(String(r.id), 10),
    display_name: r.display_name || null,
    email: r["email_primary.email"] || null,
    primary_expertise: r["MAS_Rep.Primary_Area_of_Expertise"] || null,
    areas_of_expertise: Array.isArray(areas) ? areas : areas ? [areas] : [],
    skills: r["MAS_Rep.Skills"] || "",
    share_email: r["MAS_Rep.Share_Email_with_VC_s"] ? 1 : 0,
  };
}

async function opSave(body: ProfileBody): Promise<unknown> {
  const cid = body.contact_id;

  // 1) Update the primary email (mirrors "Build Email Update Req").
  await civiApi4("Email", "update", {
    where: [
      ["contact_id", "=", cid],
      ["is_primary", "=", true],
    ],
    values: { email: body.email ?? "" },
  });

  // 2) Update the MAS_Rep custom fields (mirrors "Build Contact Update Req").
  await civiApi4("Contact", "update", {
    where: [["id", "=", cid]],
    values: {
      "MAS_Rep.Primary_Area_of_Expertise": body.primary_expertise || null,
      "MAS_Rep.Areas_of_Expertise": body.areas_of_expertise,
      "MAS_Rep.Skills": body.skills != null ? body.skills : "",
      "MAS_Rep.Share_Email_with_VC_s": body.share_email ? 1 : 0,
    },
  });

  return { op: "save", success: true, contact_id: cid };
}

export async function POST(req: Request): Promise<Response> {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "invalid_json" }, 400);
  }

  const body = normalize(raw);

  if ((body.op === "get" || body.op === "save") && !body.contact_id) {
    return json({ op: body.op, success: false, error: "missing_contact_id" }, 400);
  }
  if (body.op === "save" && (!body.email || !/^\S+@\S+\.\S+$/.test(body.email))) {
    return json({ op: "save", success: false, error: "invalid_email" }, 400);
  }

  try {
    switch (body.op) {
      case "resolve":
        return json(await opResolve(body));
      case "get":
        return json(await opGet(body));
      case "save":
        return json(await opSave(body));
      default:
        return json({ success: false, error: "unknown_op" }, 400);
    }
  } catch (err) {
    const msg = err instanceof CiviError ? err.message : err instanceof Error ? err.message : String(err);
    console.error(`profile ${body.op} failed:`, msg);
    return json({ op: body.op, success: false, error: "server_error" }, 500);
  }
}
