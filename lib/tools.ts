import { tool } from "ai";
import { z } from "zod";
import {
  civiApi4,
  isAuthorized,
  emailConsentGiven,
  type AuthContext,
} from "./civicrm";
import { searchKnowledgeBase } from "./kb";

/**
 * The 6 agent tools, ported from the live n8n `vc-chatbot-civicrm-sub`
 * (5 CiviCRM tools) and `kb-retrieval-sub` (search_knowledge_base).
 *
 * `buildTools(auth)` closes over the requesting VC's access context (resolved
 * once per request in the route). CiviCRM queries run unrestricted; the per-tool
 * redactors NULL email/phone on rows outside the VC's authorised set — matching
 * the `Redact Privacy` node.
 */

type Row = Record<string, unknown>;

const LIKE = (t: string) => `%${t}%`;

export function buildTools(auth: AuthContext) {
  return {
    search_contacts: tool({
      description:
        "Search for contacts in CiviCRM by name, email, or organization. filter_type: 'all' (default), 'active_vcs' (active Volunteer Coordinators), 'vcs_by_skill' (match a Practice Area / expertise / skills phrase), 'org_employees' (requires organization_id), or 'by_email' (exact email). Returns id, display_name, contact_type, email, employer. VC emails are only returned when the VC has consented.",
      inputSchema: z.object({
        search_term: z.string().optional().describe("Name, email, keyword, or skill phrase"),
        filter_type: z
          .enum(["all", "active_vcs", "vcs_by_skill", "org_employees", "by_email"])
          .optional()
          .describe("How to scope the search (default 'all')"),
        organization_id: z.number().optional().describe("Org contact ID (required for org_employees)"),
        limit: z.number().optional().describe("Max results (default 25)"),
      }),
      execute: async ({ search_term, filter_type = "all", organization_id, limit = 25 }) => {
        const term = (search_term ?? "").trim();
        const select = [
          "id",
          "display_name",
          "contact_type",
          "email_primary.email",
          "employer_id",
          "employer_id.display_name",
          "MAS_Rep.Share_Email_with_VC_s",
        ];
        const params: Row = { select, limit };

        if (filter_type === "active_vcs") {
          const where: unknown[] = [
            ["contact_sub_type:name", "CONTAINS", "MAS_Rep"],
            ["MAS_Rep.VC_Status:name", "=", "Active"],
          ];
          if (term)
            where.push([
              "OR",
              [
                ["display_name", "LIKE", LIKE(term)],
                ["email_primary.email", "LIKE", LIKE(term)],
                ["employer_id.display_name", "LIKE", LIKE(term)],
              ],
            ]);
          params.where = where;
        } else if (filter_type === "vcs_by_skill") {
          select.push(
            "MAS_Rep.Primary_Area_of_Expertise:label",
            "MAS_Rep.Areas_of_Expertise:label",
            "MAS_Rep.Skills",
          );
          params.where = [
            ["contact_sub_type:name", "CONTAINS", "MAS_Rep"],
            ["MAS_Rep.VC_Status:name", "=", "Active"],
            [
              "OR",
              [
                ["MAS_Rep.Primary_Area_of_Expertise:label", "=", term],
                ["MAS_Rep.Areas_of_Expertise:label", "CONTAINS", term],
                ["MAS_Rep.Skills", "LIKE", LIKE(term)],
              ],
            ],
          ];
        } else if (filter_type === "org_employees") {
          if (!organization_id) return "organization_id is required for filter_type org_employees.";
          params.where = [
            ["employer_id", "=", organization_id],
            ["contact_sub_type:name", "CONTAINS", "MAS_Rep"],
            ["MAS_Rep.VC_Status:name", "=", "Active"],
          ];
        } else if (filter_type === "by_email") {
          params.join = [["Email AS email_join", "LEFT", ["email_join.contact_id", "=", "id"]]];
          params.where = [["email_join.email", "=", term]];
        } else {
          // default 'all'
          if (term) {
            params.where = [
              [
                "OR",
                [
                  ["AND", [["contact_type:name", "=", "Organization"], ["display_name", "LIKE", LIKE(term)]]],
                  [
                    "AND",
                    [
                      ["contact_sub_type:name", "CONTAINS", "MAS_Rep"],
                      ["MAS_Rep.VC_Status:name", "=", "Active"],
                      [
                        "OR",
                        [
                          ["display_name", "LIKE", LIKE(term)],
                          ["email_primary.email", "LIKE", LIKE(term)],
                          ["employer_id.display_name", "LIKE", LIKE(term)],
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ];
          }
        }

        const rows = await civiApi4<Row>("Contact", "get", params);
        // Redact: keep email only if authorized OR the VC consented to share.
        for (const r of rows) {
          const allowed =
            isAuthorized(auth, r["id"], r["employer_id"]) ||
            emailConsentGiven(r["MAS_Rep.Share_Email_with_VC_s"]);
          if (!allowed) r["email_primary.email"] = null;
        }
        return JSON.stringify(rows);
      },
    }),

    get_contact: tool({
      description:
        "Get full details for a specific contact by their CiviCRM contact ID: name, type/sub-type, email, phone, employer, VC status and expertise.",
      inputSchema: z.object({
        contactId: z.number().describe("The CiviCRM contact ID"),
      }),
      execute: async ({ contactId }) => {
        const rows = await civiApi4<Row>("Contact", "get", {
          select: [
            "id",
            "display_name",
            "first_name",
            "last_name",
            "contact_type",
            "contact_sub_type:name",
            "email_primary.email",
            "phone_primary.phone",
            "employer_id",
            "employer_id.display_name",
            "created_date",
            "modified_date",
            "MAS_Rep.VC_Status:name",
            "MAS_Rep.Primary_Area_of_Expertise:label",
            "MAS_Rep.Areas_of_Expertise:label",
            "MAS_Rep.Skills",
            "MAS_Rep.Share_Email_with_VC_s",
          ],
          where: [["id", "=", contactId]],
          limit: 1,
        });
        for (const r of rows) {
          const allowed =
            isAuthorized(auth, r["id"], r["employer_id"]) ||
            emailConsentGiven(r["MAS_Rep.Share_Email_with_VC_s"]);
          if (!allowed) {
            r["email_primary.email"] = null;
            r["phone_primary.phone"] = null;
          }
        }
        return JSON.stringify(rows);
      },
    }),

    search_cases: tool({
      description:
        "Search MAS consulting cases. Filter by unassigned (true → 'Sent for Assignment'), vc_contact_id, client_org_id, client_name (LIKE), or status. Returns case id, code, subject, practice area, status, client, and VC coordinator.",
      inputSchema: z.object({
        unassigned: z.boolean().optional(),
        vc_contact_id: z.number().optional(),
        client_org_id: z.number().optional(),
        client_name: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().optional().describe("Max results (default 25)"),
      }),
      execute: async ({ unassigned, vc_contact_id, client_org_id, client_name, status, limit = 25 }) => {
        const where: unknown[] = [];
        if (unassigned) where.push(["status_id:name", "=", "Sent for Assignment"]);
        if (vc_contact_id) where.push(["vc.id", "=", vc_contact_id]);
        if (client_org_id) where.push(["client.employer_id", "=", client_org_id]);
        if (client_name) where.push(["client.sort_name", "LIKE", LIKE(client_name)]);
        if (status) where.push(["status_id:name", "=", status]);

        const rows = await civiApi4<Row>("Case", "get", {
          select: [
            "id",
            "subject",
            "case_type_id:label",
            "status_id:name",
            "start_date",
            "end_date",
            "created_date",
            "modified_date",
            "Cases_SR_Projects_.MAS_SR_Case_Code",
            "Cases_SR_Projects_.Notes",
            "Cases_SR_Projects_.Practice_Area:label",
            "Cases_SR_Projects_.Requested_Start_Date",
            "Cases_SR_Projects_.Referral:label",
            "Cases_SR_Projects_.Virtual_Work:label",
            "client.id",
            "client.sort_name",
            "client.email_primary.email",
            "client.employer_id",
            "vc.near_contact_id",
            "vc.near_contact_id.sort_name",
            "vc.near_contact_id.email_primary.email",
          ],
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
          ],
          where,
          limit,
        });
        for (const r of rows) {
          if (!isAuthorized(auth, r["client.id"], r["client.employer_id"])) {
            r["client.email_primary.email"] = null;
            r["vc.near_contact_id.email_primary.email"] = null;
          }
        }
        return JSON.stringify(rows);
      },
    }),

    get_case: tool({
      description:
        "Get full details for a specific MAS consulting case by its ID, including subject, status, client organization, VC coordinator, and client rep.",
      inputSchema: z.object({ caseId: z.number().describe("The CiviCRM case ID") }),
      execute: async ({ caseId }) => {
        const rows = await civiApi4<Row>("Case", "get", {
          select: [
            "id",
            "subject",
            "details",
            "case_type_id:label",
            "status_id:name",
            "start_date",
            "end_date",
            "Cases_SR_Projects_.MAS_SR_Case_Code",
            "Cases_SR_Projects_.Notes",
            "Cases_SR_Projects_.Practice_Area:label",
            "client.id",
            "client.sort_name",
            "client.email_primary.email",
            "client.employer_id",
            "client.employer_id.display_name",
            "vc.near_contact_id",
            "vc.near_contact_id.sort_name",
            "vc.near_contact_id.email_primary.email",
            "client_rep.near_contact_id",
            "client_rep.near_contact_id.display_name",
            "client_rep.near_contact_id.email_primary.email",
          ],
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
          where: [["id", "=", caseId]],
          limit: 1,
        });
        for (const r of rows) {
          if (!isAuthorized(auth, r["client.id"], r["client.employer_id"])) {
            r["client.email_primary.email"] = null;
            r["vc.near_contact_id.email_primary.email"] = null;
            r["client_rep.near_contact_id.email_primary.email"] = null;
          }
        }
        return JSON.stringify(rows);
      },
    }),

    get_org_contacts: tool({
      description:
        "Get all contacts related to a client organization: employees, volunteers, board members, client reps, presidents, executive directors. Pass the organization's CiviCRM contact ID.",
      inputSchema: z.object({ organization_id: z.number().describe("Organization contact ID") }),
      execute: async ({ organization_id }) => {
        const rows = await civiApi4<Row>("Relationship", "get", {
          select: [
            "id",
            "contact_id_a",
            "contact_id_a.display_name",
            "contact_id_a.email_primary.email",
            "contact_id_a.phone_primary.phone",
            "contact_id_a.job_title",
            "relationship_type_id:label",
            "is_active",
          ],
          where: [
            ["contact_id_b", "=", organization_id],
            ["relationship_type_id", "IN", [5, 6, 15, 17, 19, 20]],
          ],
          limit: 50,
        });
        for (const r of rows) {
          if (!isAuthorized(auth, r["contact_id_a"], organization_id)) {
            r["contact_id_a.email_primary.email"] = null;
            r["contact_id_a.phone_primary.phone"] = null;
          }
        }
        return JSON.stringify(rows);
      },
    }),

    search_knowledge_base: tool({
      description:
        "Search the MAS knowledge base for information about MAS processes, policies, procedures, guidelines, and nonprofit consulting topics. Input should be a clear question or search query, or a document title when asked for a link.",
      inputSchema: z.object({
        query: z.string().describe("A clear question, search query, or document title"),
      }),
      execute: async ({ query: q }) => searchKnowledgeBase(q, "mas_vc", ""),
    }),
  };
}
