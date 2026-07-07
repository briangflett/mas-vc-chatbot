import { civiApi4 } from "./civicrm";

/**
 * Resolve the logged-in VC's CiviCRM identity BEFORE the agent runs — ported
 * from the n8n `Build VC Lookup` → `Lookup VC Contact` → `Inject Contact ID`
 * chain (ADR-016).
 *
 * Fast path: the WordPress widget usually caches and passes `civicrm_contact_id`
 * in metadata, so no CiviCRM call is needed. Otherwise we look the VC up by
 * email. If neither is available we return an unresolved identity (NO phantom
 * default contact id — that was an old bug).
 */

export interface VcMetadata {
  wp_user_id?: number;
  wp_user_email?: string;
  wp_display_name?: string;
  civicrm_contact_id?: number | null;
  civicrm_display_name?: string | null;
}

export interface VcIdentity {
  civicrmContactId: number | null;
  civicrmDisplayName: string | null;
  wpUserEmail: string | null;
}

type Row = Record<string, unknown>;

export async function resolveVcIdentity(md: VcMetadata): Promise<VcIdentity> {
  const wpUserEmail = md.wp_user_email ?? null;

  // Fast path — widget already resolved and cached the contact ID.
  if (md.civicrm_contact_id) {
    return {
      civicrmContactId: md.civicrm_contact_id,
      civicrmDisplayName: md.civicrm_display_name ?? null,
      wpUserEmail,
    };
  }

  // Resolve by email.
  if (wpUserEmail) {
    try {
      const rows = await civiApi4<Row>("Contact", "get", {
        select: ["id", "display_name", "contact_sub_type"],
        join: [["Email AS email_join", "LEFT", ["email_join.contact_id", "=", "id"]]],
        where: [["email_join.email", "=", wpUserEmail]],
        limit: 3,
      });
      // Prefer a MAS_Rep sub-typed contact, else the first match.
      const masRep = rows.find((c) => {
        const st = c["contact_sub_type"];
        const types = Array.isArray(st) ? st : [st];
        return types.some((x) => String(x).includes("MAS_Rep"));
      });
      const contact = masRep ?? rows[0] ?? null;
      if (contact) {
        return {
          civicrmContactId: Number(contact["id"]),
          civicrmDisplayName: (contact["display_name"] as string) ?? null,
          wpUserEmail,
        };
      }
    } catch {
      // Fall through to unresolved — the agent handles the unresolved case.
    }
  }

  return { civicrmContactId: null, civicrmDisplayName: null, wpUserEmail };
}
