/**
 * CiviCRM API4 client + access-control context for the VC chatbot.
 *
 * Ported from the live n8n `vc-chatbot-civicrm-sub` (ID nmVIws1rIVYhpgMi).
 *
 * Auth model (IMPORTANT — this differs from the archived ADRs):
 *   Queries run UNRESTRICTED with `checkPermissions: false` (the chatbot uses a
 *   trusted CiviCRM service account). Access control is REDACTION-based, applied
 *   AFTER the query: `getAuthContext()` resolves the set of contact/org IDs the
 *   requesting VC is authorised to see PII for (the clients on their own cases,
 *   plus those clients' orgs and client reps), and the per-tool redactors NULL
 *   email/phone on any row outside that set. VC emails additionally pass through
 *   when the VC has consented (`MAS_Rep.Share_Email_with_VC_s`).
 *
 * The service-account credentials (site key + API key) came from the n8n
 * "CiviCRM Custom Auth" credential (WIv1YM35QT3gS3E9). Supply them as env vars.
 */

const BASE_URL = process.env.CIVICRM_BASE_URL ?? "https://www.masadvise.org";

export class CiviError extends Error {}

/** Low-level CiviCRM API4 call. Returns the `values` array. */
export async function civiApi4<T = Record<string, unknown>>(
  entity: string,
  action: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const apiKey = process.env.CIVICRM_API_KEY;
  const siteKey = process.env.CIVICRM_SITE_KEY;
  if (!apiKey || !siteKey) {
    throw new CiviError("CIVICRM_API_KEY / CIVICRM_SITE_KEY are not set");
  }

  const body = new URLSearchParams({ params: JSON.stringify({ checkPermissions: false, ...params }) });

  const res = await fetch(`${BASE_URL}/civicrm/ajax/api4/${entity}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Civi-Auth": `Bearer ${apiKey}`,
      "X-Civi-Key": siteKey,
    },
    body: body.toString(),
  });

  if (res.status === 401 || res.status === 403) {
    throw new CiviError("unauthorized: CiviCRM permission check failed");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new CiviError(`CiviCRM API4 ${entity}/${action} failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { values?: T[] };
  return json.values ?? [];
}

export interface AuthContext {
  contactIds: Set<string>;
  orgIds: Set<string>;
}

/**
 * Resolve the requesting VC's authorised contact/org IDs — the clients on cases
 * where they are the "Case Coordinator is" relation, plus those clients'
 * employer orgs and client reps. Mirrors the `Build Auth Request` +
 * `Merge Auth Context` nodes. Returns empty sets if the VC is unresolved.
 */
export async function getAuthContext(requestingVcId: number | null | undefined): Promise<AuthContext> {
  const contactIds = new Set<string>();
  const orgIds = new Set<string>();
  if (!requestingVcId) return { contactIds, orgIds };

  const rows = await civiApi4<Record<string, unknown>>("Case", "get", {
    select: ["id", "client.id", "client.employer_id", "client_rep.near_contact_id"],
    join: [
      ["Contact AS client", "LEFT", "CaseContact", ["id", "=", "client.case_id"]],
      [
        "Contact AS vc",
        "LEFT",
        "RelationshipCache",
        ["client.id", "=", "vc.far_contact_id"],
        ["vc.near_relation:name", "=", '"Case Coordinator is"'],
        ["vc.case_id", "=", "id"],
      ],
      [
        "Contact AS client_rep",
        "LEFT",
        "RelationshipCache",
        ["client.id", "=", "client_rep.far_contact_id"],
        ["client_rep.near_relation:name", "=", '"Case Client Rep is"'],
        ["client_rep.case_id", "=", "id"],
      ],
    ],
    where: [["vc.id", "=", requestingVcId]],
    limit: 1000,
  });

  for (const row of rows) {
    if (row["client.id"]) contactIds.add(String(row["client.id"]));
    if (row["client.employer_id"]) orgIds.add(String(row["client.employer_id"]));
    if (row["client_rep.near_contact_id"]) contactIds.add(String(row["client_rep.near_contact_id"]));
  }
  return { contactIds, orgIds };
}

/** True if a contact (optionally with an employer org) is in the VC's auth scope. */
export function isAuthorized(
  auth: AuthContext,
  contactId: unknown,
  employerId?: unknown,
): boolean {
  if (contactId != null && auth.contactIds.has(String(contactId))) return true;
  if (employerId != null && auth.orgIds.has(String(employerId))) return true;
  return false;
}

/** Truthy check for the VC email-sharing consent custom field. */
export function emailConsentGiven(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}
