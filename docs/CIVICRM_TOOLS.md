# CiviCRM Tools Specification

**Version**: 1.0.0
**Last Updated**: 2026-01-17
**Purpose**: Unified tool definitions for n8n workflows AND future MCP server

---

## Overview

This document defines the CiviCRM tool API that will be implemented in n8n workflows and later reused in an MCP (Model Context Protocol) server. The goal is to have a single source of truth for tool behavior that works seamlessly with both implementations.

### Design Principles

1. **OpenAPI Compatible**: Tool schemas follow OpenAPI/JSON Schema standards
2. **Provider Agnostic**: Works with Claude, ChatGPT, and other LLMs
3. **Implementation Flexible**: Can be implemented in n8n, MCP server, or any HTTP API
4. **Future-Proof**: Easy to extend without breaking existing integrations

---

## Tool Catalog

### 1. search_contacts

**Purpose**: Search for contacts in CiviCRM by name, email, organization, or other criteria.

**Use Cases**:
- "Find contact information for John Smith"
- "Search for organizations related to technology"
- "Who is the contact for ABC Corporation?"

**Tool Definition**:
```json
{
  "name": "search_contacts",
  "description": "Search for contacts in CiviCRM by name, email, organization, or other criteria. Returns basic contact information including name, type, email, and phone. Use this when you need to find a contact but don't have their ID.",
  "input_schema": {
    "type": "object",
    "properties": {
      "search_term": {
        "type": "string",
        "description": "Name, email, or organization to search for. Can be partial match (e.g., 'Smith' will find 'John Smith')"
      },
      "contact_type": {
        "type": "string",
        "enum": ["Individual", "Organization", "Household"],
        "description": "Filter results by contact type (optional)"
      },
      "limit": {
        "type": "number",
        "default": 10,
        "minimum": 1,
        "maximum": 50,
        "description": "Maximum number of results to return (default 10, max 50)"
      }
    },
    "required": ["search_term"]
  }
}
```

**CiviCRM API v4 Implementation**:
```javascript
// Endpoint: POST /civicrm/ajax/api4/Contact/get
{
  "select": [
    "id",
    "display_name",
    "contact_type",
    "email_primary.email",
    "phone_primary.phone"
  ],
  "where": [
    ["OR", [
      ["display_name", "LIKE", "%{search_term}%"],
      ["email_primary.email", "LIKE", "%{search_term}%"],
      ["organization_name", "LIKE", "%{search_term}%"]
    ]]
    // Add contact_type filter if provided
  ],
  "limit": 10 // or user-specified limit
}
```

**Response Format**:
```json
{
  "success": true,
  "tool_name": "search_contacts",
  "result": {
    "count": 2,
    "contacts": [
      {
        "id": 123,
        "name": "John Smith",
        "type": "Individual",
        "email": "john.smith@example.com",
        "phone": "+1-416-555-0100"
      },
      {
        "id": 124,
        "name": "Jane Smith",
        "type": "Individual",
        "email": "jane.smith@example.com",
        "phone": "+1-416-555-0101"
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "tool_name": "search_contacts",
  "error": {
    "code": "NO_RESULTS",
    "message": "No contacts found matching 'xyz'",
    "user_message": "I couldn't find any contacts matching that search term."
  }
}
```

---

### 2. get_contact

**Purpose**: Get detailed information about a specific contact by ID.

**Use Cases**:
- "Show me all details for contact ID 123"
- "What's the full address for this contact?"
- "Get complete information including custom fields"

**Tool Definition**:
```json
{
  "name": "get_contact",
  "description": "Get detailed information about a specific contact by ID. Returns all contact fields including custom fields, addresses, phones, emails, and notes. Use this when you have a contact ID and need complete information.",
  "input_schema": {
    "type": "object",
    "properties": {
      "contact_id": {
        "type": "number",
        "description": "CiviCRM contact ID (numeric). Get this from search_contacts first if you don't have the ID."
      }
    },
    "required": ["contact_id"]
  }
}
```

**CiviCRM API v4 Implementation**:
```javascript
// Endpoint: POST /civicrm/ajax/api4/Contact/get
{
  "select": [
    "id",
    "display_name",
    "contact_type",
    "contact_sub_type",
    "organization_name",
    "job_title",
    "birth_date",
    "email_primary.email",
    "phone_primary.phone",
    "address_primary.*",
    "custom.*" // All custom fields
  ],
  "where": [
    ["id", "=", contact_id]
  ],
  "limit": 1
}
```

**Response Format**:
```json
{
  "success": true,
  "tool_name": "get_contact",
  "result": {
    "id": 123,
    "display_name": "John Smith",
    "contact_type": "Individual",
    "contact_sub_type": "Client",
    "organization_name": null,
    "job_title": "Software Engineer",
    "birth_date": "1985-06-15",
    "email": "john.smith@example.com",
    "phone": "+1-416-555-0100",
    "address": {
      "street_address": "123 Main St",
      "city": "Toronto",
      "province": "ON",
      "postal_code": "M5H 2N2",
      "country": "Canada"
    },
    "custom_fields": {
      "preferred_contact_method": "Email",
      "industry": "Technology",
      "notes": "Prefers morning meetings"
    }
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "tool_name": "get_contact",
  "error": {
    "code": "NOT_FOUND",
    "message": "Contact ID 999 not found",
    "user_message": "I couldn't find a contact with that ID. Please verify the ID is correct."
  }
}
```

---

### 3. search_cases

**Purpose**: Search for cases in CiviCRM with optional filters.

**Use Cases**:
- "Show me all open cases"
- "Find cases for contact ID 123"
- "What cases were created last month?"
- "Show consulting cases with status 'In Progress'"

**Tool Definition**:
```json
{
  "name": "search_cases",
  "description": "Search for cases in CiviCRM. Can filter by contact, case type, status, or date range. Returns case summaries including subject, type, status, dates, and client name. Use this to find cases matching specific criteria.",
  "input_schema": {
    "type": "object",
    "properties": {
      "contact_id": {
        "type": "number",
        "description": "Filter cases by contact ID (optional). Only show cases for this specific contact."
      },
      "case_type": {
        "type": "string",
        "description": "Filter by case type (optional). Examples: 'Consulting', 'Training', 'Technology Support'"
      },
      "status": {
        "type": "string",
        "description": "Filter by case status (optional). Examples: 'Open', 'Closed', 'In Progress', 'On Hold'"
      },
      "start_date": {
        "type": "string",
        "format": "date",
        "description": "Filter cases created/modified after this date (optional). Format: YYYY-MM-DD"
      },
      "end_date": {
        "type": "string",
        "format": "date",
        "description": "Filter cases created/modified before this date (optional). Format: YYYY-MM-DD"
      },
      "limit": {
        "type": "number",
        "default": 20,
        "minimum": 1,
        "maximum": 100,
        "description": "Maximum number of results to return (default 20, max 100)"
      }
    },
    "required": []
  }
}
```

**CiviCRM API v4 Implementation**:
```javascript
// Endpoint: POST /civicrm/ajax/api4/Case/get
{
  "select": [
    "id",
    "subject",
    "case_type_id:label",
    "status_id:label",
    "start_date",
    "end_date",
    "details",
    "contact_id.display_name"
  ],
  "where": [
    // Add filters based on input parameters
    // Example: ["contact_id", "=", 123]
    // Example: ["case_type_id:label", "=", "Consulting"]
    // Example: ["status_id:label", "=", "Open"]
    // Example: ["start_date", ">=", "2024-01-01"]
  ],
  "limit": 20, // or user-specified limit
  "orderBy": {
    "start_date": "DESC"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "tool_name": "search_cases",
  "result": {
    "count": 3,
    "cases": [
      {
        "id": 456,
        "subject": "Technology assessment for ABC Corp",
        "type": "Consulting",
        "status": "In Progress",
        "start_date": "2026-01-10",
        "end_date": null,
        "client": "John Smith"
      },
      {
        "id": 457,
        "subject": "WordPress training session",
        "type": "Training",
        "status": "Completed",
        "start_date": "2026-01-05",
        "end_date": "2026-01-12",
        "client": "Jane Doe"
      },
      {
        "id": 458,
        "subject": "CiviCRM implementation support",
        "type": "Technology Support",
        "status": "Open",
        "start_date": "2026-01-15",
        "end_date": null,
        "client": "XYZ Nonprofit"
      }
    ]
  }
}
```

---

### 4. get_case

**Purpose**: Get detailed information about a specific case including activities timeline.

**Use Cases**:
- "Show me all details for case ID 456"
- "What activities have been logged for this case?"
- "Get the complete case history"

**Tool Definition**:
```json
{
  "name": "get_case",
  "description": "Get detailed information about a specific case including all activities. Returns complete case record with subject, type, status, dates, client information, and chronological activity timeline. Use this when you have a case ID and need full details.",
  "input_schema": {
    "type": "object",
    "properties": {
      "case_id": {
        "type": "number",
        "description": "CiviCRM case ID (numeric). Get this from search_cases first if you don't have the ID."
      }
    },
    "required": ["case_id"]
  }
}
```

**CiviCRM API v4 Implementation**:
```javascript
// Step 1: Get case details
// Endpoint: POST /civicrm/ajax/api4/Case/get
{
  "select": [
    "id",
    "subject",
    "case_type_id:label",
    "status_id:label",
    "start_date",
    "end_date",
    "details",
    "contact_id.display_name",
    "custom.*"
  ],
  "where": [
    ["id", "=", case_id]
  ],
  "limit": 1
}

// Step 2: Get case activities
// Endpoint: POST /civicrm/ajax/api4/Activity/get
{
  "select": [
    "id",
    "subject",
    "activity_type_id:label",
    "activity_date_time",
    "status_id:label",
    "details"
  ],
  "where": [
    ["case_id", "=", case_id]
  ],
  "orderBy": {
    "activity_date_time": "DESC"
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "tool_name": "get_case",
  "result": {
    "id": 456,
    "subject": "Technology assessment for ABC Corp",
    "type": "Consulting",
    "status": "In Progress",
    "start_date": "2026-01-10",
    "end_date": null,
    "details": "Initial technology needs assessment for small nonprofit organization",
    "client": "John Smith",
    "custom_fields": {
      "project_budget": "$5,000",
      "consultant_assigned": "Brian Flett"
    },
    "activities": [
      {
        "id": 789,
        "subject": "Initial consultation meeting",
        "type": "Meeting",
        "date": "2026-01-10T14:00:00",
        "status": "Completed",
        "details": "Discussed current technology stack and pain points"
      },
      {
        "id": 790,
        "subject": "Technology assessment report",
        "type": "Document",
        "date": "2026-01-15T10:00:00",
        "status": "In Progress",
        "details": "Drafting recommendations for CRM and website improvements"
      }
    ]
  }
}
```

---

## Error Handling

### Standard Error Response Format

All tools use consistent error response structure:

```json
{
  "success": false,
  "tool_name": "tool_name_here",
  "error": {
    "code": "ERROR_CODE",
    "message": "Technical error message for logging",
    "user_message": "Friendly message to show to user"
  }
}
```

### Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| `INVALID_INPUT` | Required parameter missing or invalid | "The request was missing required information. Please check your input and try again." |
| `NOT_FOUND` | Requested resource doesn't exist | "I couldn't find that record. Please verify the ID is correct." |
| `NO_RESULTS` | Search returned zero results | "No results found matching your search criteria." |
| `API_ERROR` | CiviCRM API returned an error | "There was a problem accessing CiviCRM. Please try again in a moment." |
| `TIMEOUT` | Request exceeded timeout limit | "The request took too long. Please try again or narrow your search." |
| `UNAUTHORIZED` | Authentication failed | "I don't have permission to access that data. Please contact your administrator." |
| `RATE_LIMIT` | Too many requests | "Too many requests. Please wait a moment and try again." |

### Timeout Policy

- **Individual tool calls**: 10 second timeout
- **Multiple tool calls in sequence**: Each gets 10 seconds
- **After timeout**: Return error, suggest manual lookup

---

## Implementation Guide

### For n8n Workflows

1. **Create subworkflow**: `civicrm-tool-handler.json`
2. **Webhook endpoint**: `/webhook/civicrm-tool`
3. **Request format**:
   ```json
   {
     "tool_name": "search_contacts",
     "tool_input": {
       "search_term": "John Smith",
       "limit": 10
     }
   }
   ```
4. **Use Switch node** to route by `tool_name`
5. **Each tool branch**:
   - Validate input
   - Build CiviCRM API query
   - Make HTTP request to CiviCRM
   - Format response
   - Return standard JSON

### For Future MCP Server

1. **Register tools** using `ListToolsRequestSchema`
2. **Handle calls** using `CallToolRequestSchema`
3. **Implementation options**:
   - **Option A**: Proxy to n8n workflow (reuse existing logic)
   - **Option B**: Implement directly (independent of n8n)
   - **Hybrid**: Use n8n for complex logic, implement simple tools directly

### Example MCP Server Integration

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { civiCRMTools } from './tool-spec.js';

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(civiCRMTools)
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: toolInput } = request.params;

  // Option A: Proxy to n8n
  const response = await fetch('https://n8n.masadvise.org/webhook/civicrm-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool_name: name,
      tool_input: toolInput
    })
  });

  return await response.json();
});
```

---

## Testing Checklist

### Unit Tests (Per Tool)

- [ ] Valid input returns expected results
- [ ] Missing required parameters returns INVALID_INPUT error
- [ ] Invalid parameter types returns INVALID_INPUT error
- [ ] Non-existent ID returns NOT_FOUND error
- [ ] Empty search results returns NO_RESULTS error
- [ ] CiviCRM API error returns API_ERROR
- [ ] Timeout scenario returns TIMEOUT error

### Integration Tests

- [ ] Tool calling via Claude API works
- [ ] Tool calling via n8n webhook works
- [ ] Multiple sequential tool calls work
- [ ] Tool calls with conversation context work
- [ ] Error responses are handled gracefully in UI

### Performance Tests

- [ ] Single tool call completes in <3 seconds
- [ ] Batch of 5 tool calls completes in <15 seconds
- [ ] Concurrent requests don't cause errors
- [ ] Large result sets (50 contacts) perform well

---

## Versioning

### Version 1.0.0 (Current)
- 4 core tools: search_contacts, get_contact, search_cases, get_case
- Basic filtering and search
- Standard error handling

### Version 1.1.0 (Planned - Phase 2)
- Add `search_activities` tool
- Add `get_relationships` tool
- Enhanced filtering (advanced queries)
- Pagination support for large result sets

### Version 2.0.0 (Planned - Phase 3)
- Add write operations (create_case, update_contact)
- Add bulk operations (batch search)
- Webhook notifications for data changes
- Advanced caching strategies

---

## Maintenance

### When to Update This Spec

1. **Adding new tools**: Update tool catalog with same format
2. **Changing parameters**: Update input_schema and bump version
3. **Changing response format**: Update response examples and bump major version
4. **New error codes**: Add to error codes table

### Breaking vs. Non-Breaking Changes

**Non-Breaking** (patch/minor version):
- Adding optional parameters
- Adding new tools
- Adding new fields to responses
- Adding new error codes

**Breaking** (major version):
- Removing tools
- Removing required parameters
- Changing parameter names
- Changing response structure
- Removing fields from responses

---

## Related Documentation

- **Project Overview**: `/docs/VC_CHATBOT_PROJECT.md`
- **n8n Workflow Implementation**: `/workflows/vc-chatbot/README.md` (to be created)
- **MCP Server Implementation**: TBD (Phase 4)
- **CiviCRM API v4 Docs**: https://docs.civicrm.org/dev/en/latest/api/v4/

---

**Last Updated**: 2026-01-17
**Next Review**: After Phase 1 implementation
**Owner**: Brian Flett
