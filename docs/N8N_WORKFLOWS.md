# n8n Workflow Templates - VC Chatbot

**Last Updated**: 2026-01-17
**Purpose**: Reference templates for building workflows in n8n UI

---

## Overview

This document provides the detailed node configurations for each n8n workflow. Use these as a reference when building workflows in the n8n UI.

**Workflows to Create**:
1. `civicrm-tool-handler` - Reusable CiviCRM tools
2. `vc-chatbot-knowledge` - Knowledge base fetcher
3. `vc-chatbot-stream` - Main streaming orchestration

---

## Workflow 1: civicrm-tool-handler

**Purpose**: Reusable CiviCRM API wrapper (works for n8n AND future MCP server)

### Node 1: Webhook Trigger

**Type**: `n8n-nodes-base.webhook`

**Parameters**:
- Path: `civicrm-tool`
- HTTP Method: POST
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `={{$env.N8N_WEBHOOK_SECRET}}`
- Response Mode: "Respond to Webhook"

**Webhook URL**: `https://n8n.masadvise.org/webhook/civicrm-tool`

---

### Node 2: Authenticate

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
// Verify webhook authentication
const authHeader = $input.item.json.headers.authorization;
const expectedSecret = `Bearer ${$env.N8N_WEBHOOK_SECRET}`;

if (!authHeader || authHeader !== expectedSecret) {
  throw new Error('Unauthorized: Invalid webhook secret');
}

// Pass through the request data
return {
  json: {
    tool_name: $input.item.json.body.tool_name,
    tool_input: $input.item.json.body.tool_input
  }
};
```

---

### Node 3: Route by Tool

**Type**: `n8n-nodes-base.switch`

**Parameters**:
- Mode: Rules
- Data Property Name: `tool_name`
- Rules:
  - Rule 1: `search_contacts` → Output 0
  - Rule 2: `get_contact` → Output 1
  - Rule 3: `search_cases` → Output 2
  - Rule 4: `get_case` → Output 3
- Fallback Output: Error (invalid tool name)

---

### Branch 1: search_contacts

#### Node 4a: Build Search Contacts Query

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const params = $input.item.json.tool_input;

// Validate required parameters
if (!params.search_term) {
  throw new Error('Missing required parameter: search_term');
}

// Build CiviCRM API v4 query
const query = {
  select: [
    'id',
    'display_name',
    'contact_type',
    'email_primary.email',
    'phone_primary.phone'
  ],
  where: [
    ['OR', [
      ['display_name', 'LIKE', `%${params.search_term}%`],
      ['email_primary.email', 'LIKE', `%${params.search_term}%`],
      ['organization_name', 'LIKE', `%${params.search_term}%`]
    ]]
  ],
  limit: params.limit || 10
};

// Add contact_type filter if provided
if (params.contact_type) {
  query.where.push(['contact_type', '=', params.contact_type]);
}

return {
  json: {
    query,
    tool_name: 'search_contacts'
  }
};
```

#### Node 4b: CiviCRM API - Search Contacts

**Type**: `n8n-nodes-base.httpRequest`

**Parameters**:
- Method: POST
- URL: `{{$env.CIVICRM_API_URL}}/Contact/get`
- Authentication: Generic Credential Type
  - Credential Type: Header Auth
  - Header Name: `X-Civi-Auth`
  - Header Value: `Bearer {{$env.CIVICRM_API_KEY}}`
- Send Body: Yes
- Body Content Type: JSON
- Body Parameters:
  - params: `{{JSON.stringify($json.query)}}`
- Options:
  - Timeout: 10000 (10 seconds)
  - Response → Never Error: Yes (handle errors manually)

#### Node 4c: Format Search Results

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const response = $input.item.json;

// Check for API errors
if (response.is_error) {
  return {
    json: {
      success: false,
      tool_name: 'search_contacts',
      error: {
        code: 'API_ERROR',
        message: response.error_message || 'CiviCRM API error',
        user_message: 'There was a problem searching CiviCRM. Please try again.'
      }
    }
  };
}

const results = response.values || [];

// Check for no results
if (results.length === 0) {
  return {
    json: {
      success: false,
      tool_name: 'search_contacts',
      error: {
        code: 'NO_RESULTS',
        message: 'Search returned no results',
        user_message: 'I couldn\'t find any contacts matching that search term.'
      }
    }
  };
}

// Format successful response
return {
  json: {
    success: true,
    tool_name: 'search_contacts',
    result: {
      count: results.length,
      contacts: results.map(contact => ({
        id: contact.id,
        name: contact.display_name,
        type: contact.contact_type,
        email: contact['email_primary.email'] || null,
        phone: contact['phone_primary.phone'] || null
      }))
    }
  }
};
```

---

### Branch 2: get_contact

#### Node 5a: Build Get Contact Query

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const params = $input.item.json.tool_input;

// Validate required parameters
if (!params.contact_id) {
  throw new Error('Missing required parameter: contact_id');
}

// Build CiviCRM API v4 query
const query = {
  select: [
    'id',
    'display_name',
    'contact_type',
    'contact_sub_type',
    'organization_name',
    'job_title',
    'birth_date',
    'email_primary.email',
    'phone_primary.phone',
    'address_primary.street_address',
    'address_primary.city',
    'address_primary.state_province_id:label',
    'address_primary.postal_code',
    'address_primary.country_id:label',
    'custom.*'
  ],
  where: [
    ['id', '=', params.contact_id]
  ],
  limit: 1
};

return {
  json: {
    query,
    tool_name: 'get_contact'
  }
};
```

#### Node 5b: CiviCRM API - Get Contact

**Type**: `n8n-nodes-base.httpRequest`

Same configuration as Node 4b, but URL is still `/Contact/get`

#### Node 5c: Format Contact Details

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const response = $input.item.json;

// Check for API errors
if (response.is_error) {
  return {
    json: {
      success: false,
      tool_name: 'get_contact',
      error: {
        code: 'API_ERROR',
        message: response.error_message || 'CiviCRM API error',
        user_message: 'There was a problem retrieving contact details.'
      }
    }
  };
}

const contact = response.values?.[0];

// Check if contact exists
if (!contact) {
  return {
    json: {
      success: false,
      tool_name: 'get_contact',
      error: {
        code: 'NOT_FOUND',
        message: `Contact ID ${$input.item.json.tool_input.contact_id} not found`,
        user_message: 'I couldn\'t find a contact with that ID. Please verify the ID is correct.'
      }
    }
  };
}

// Extract custom fields
const customFields = {};
Object.keys(contact).forEach(key => {
  if (key.startsWith('custom.')) {
    customFields[key.replace('custom.', '')] = contact[key];
  }
});

// Format successful response
return {
  json: {
    success: true,
    tool_name: 'get_contact',
    result: {
      id: contact.id,
      display_name: contact.display_name,
      contact_type: contact.contact_type,
      contact_sub_type: contact.contact_sub_type,
      organization_name: contact.organization_name,
      job_title: contact.job_title,
      birth_date: contact.birth_date,
      email: contact['email_primary.email'],
      phone: contact['phone_primary.phone'],
      address: {
        street_address: contact['address_primary.street_address'],
        city: contact['address_primary.city'],
        province: contact['address_primary.state_province_id:label'],
        postal_code: contact['address_primary.postal_code'],
        country: contact['address_primary.country_id:label']
      },
      custom_fields: customFields
    }
  }
};
```

---

### Branch 3: search_cases

#### Node 6a: Build Search Cases Query

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const params = $input.item.json.tool_input;

// Build CiviCRM API v4 query
const query = {
  select: [
    'id',
    'subject',
    'case_type_id:label',
    'status_id:label',
    'start_date',
    'end_date',
    'details',
    'contact_id.display_name'
  ],
  where: [],
  limit: params.limit || 20,
  orderBy: { start_date: 'DESC' }
};

// Add optional filters
if (params.contact_id) {
  query.where.push(['contact_id', '=', params.contact_id]);
}
if (params.case_type) {
  query.where.push(['case_type_id:label', '=', params.case_type]);
}
if (params.status) {
  query.where.push(['status_id:label', '=', params.status]);
}
if (params.start_date) {
  query.where.push(['start_date', '>=', params.start_date]);
}
if (params.end_date) {
  query.where.push(['start_date', '<=', params.end_date]);
}

return {
  json: {
    query,
    tool_name: 'search_cases'
  }
};
```

#### Node 6b: CiviCRM API - Search Cases

**Type**: `n8n-nodes-base.httpRequest`

Same as Node 4b, but URL: `{{$env.CIVICRM_API_URL}}/Case/get`

#### Node 6c: Format Case Results

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const response = $input.item.json;

if (response.is_error) {
  return {
    json: {
      success: false,
      tool_name: 'search_cases',
      error: {
        code: 'API_ERROR',
        message: response.error_message,
        user_message: 'There was a problem searching cases.'
      }
    }
  };
}

const results = response.values || [];

if (results.length === 0) {
  return {
    json: {
      success: false,
      tool_name: 'search_cases',
      error: {
        code: 'NO_RESULTS',
        message: 'No cases found',
        user_message: 'I couldn\'t find any cases matching your criteria.'
      }
    }
  };
}

return {
  json: {
    success: true,
    tool_name: 'search_cases',
    result: {
      count: results.length,
      cases: results.map(c => ({
        id: c.id,
        subject: c.subject,
        type: c['case_type_id:label'],
        status: c['status_id:label'],
        start_date: c.start_date,
        end_date: c.end_date,
        client: c['contact_id.display_name']
      }))
    }
  }
};
```

---

### Branch 4: get_case

#### Node 7a: Build Get Case Query

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const params = $input.item.json.tool_input;

if (!params.case_id) {
  throw new Error('Missing required parameter: case_id');
}

const query = {
  select: [
    'id',
    'subject',
    'case_type_id:label',
    'status_id:label',
    'start_date',
    'end_date',
    'details',
    'contact_id.display_name',
    'custom.*'
  ],
  where: [
    ['id', '=', params.case_id]
  ],
  limit: 1
};

return {
  json: {
    query,
    case_id: params.case_id,
    tool_name: 'get_case'
  }
};
```

#### Node 7b: CiviCRM API - Get Case

**Type**: `n8n-nodes-base.httpRequest`

Same as Node 6b (Case/get)

#### Node 7c: Get Case Activities

**Type**: `n8n-nodes-base.httpRequest`

**Parameters**:
- Method: POST
- URL: `{{$env.CIVICRM_API_URL}}/Activity/get`
- Authentication: Same as above
- Body:
  ```javascript
  {
    "params": JSON.stringify({
      "select": [
        "id",
        "subject",
        "activity_type_id:label",
        "activity_date_time",
        "status_id:label",
        "details"
      ],
      "where": [
        ["case_id", "=", $node["Build Get Case Query"].json.case_id]
      ],
      "orderBy": {
        "activity_date_time": "DESC"
      }
    })
  }
  ```

#### Node 7d: Format Case Details

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
// Get case data from first HTTP request
const caseResponse = $node["CiviCRM API - Get Case"].json;
const caseData = caseResponse.values?.[0];

// Get activities from second HTTP request
const activitiesResponse = $input.item.json;
const activities = activitiesResponse.values || [];

// Check for errors
if (caseResponse.is_error || !caseData) {
  return {
    json: {
      success: false,
      tool_name: 'get_case',
      error: {
        code: 'NOT_FOUND',
        message: 'Case not found',
        user_message: 'I couldn\'t find a case with that ID.'
      }
    }
  };
}

// Extract custom fields
const customFields = {};
Object.keys(caseData).forEach(key => {
  if (key.startsWith('custom.')) {
    customFields[key.replace('custom.', '')] = caseData[key];
  }
});

// Format successful response
return {
  json: {
    success: true,
    tool_name: 'get_case',
    result: {
      id: caseData.id,
      subject: caseData.subject,
      type: caseData['case_type_id:label'],
      status: caseData['status_id:label'],
      start_date: caseData.start_date,
      end_date: caseData.end_date,
      details: caseData.details,
      client: caseData['contact_id.display_name'],
      custom_fields: customFields,
      activities: activities.map(a => ({
        id: a.id,
        subject: a.subject,
        type: a['activity_type_id:label'],
        date: a.activity_date_time,
        status: a['status_id:label'],
        details: a.details
      }))
    }
  }
};
```

---

### Node 8: Merge All Branches

**Type**: `n8n-nodes-base.merge`

**Parameters**:
- Mode: Append
- Inputs: 4 (one from each branch)

---

### Node 9: Respond to Webhook

**Type**: `n8n-nodes-base.respondToWebhook`

**Parameters**:
- Respond With: JSON
- Response Body: `{{JSON.stringify($json)}}`

---

## Workflow 2: vc-chatbot-knowledge

**Purpose**: Fetch knowledge base from Google Drive

### Node 1: Manual Trigger

**Type**: `n8n-nodes-base.manualTrigger`

(Can add Schedule trigger later for automated refresh)

---

### Node 2: List Knowledge Base Files

**Type**: `n8n-nodes-base.googleDrive`

**Parameters**:
- Resource: Drive
- Operation: List
- Filters:
  - Folder ID: [Your "VC Chatbot Knowledge Base" folder ID]
  - Include Items From All Drives: No
- Options:
  - Fields: id, name, mimeType, modifiedTime

---

### Node 3: Filter Markdown Files

**Type**: `n8n-nodes-base.filter`

**Parameters**:
- Conditions:
  - mimeType equals `application/vnd.google-apps.document`
  - OR name ends with `.md`

---

### Node 4: Get File Content

**Type**: `n8n-nodes-base.googleDrive`

**Parameters**:
- Resource: File
- Operation: Download
- File ID: `{{$json.id}}`
- Options:
  - Binary Property: data
  - Convert Document: Yes (to plain text)

---

### Node 5: Convert to Text

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const items = $input.all();

const documents = items.map(item => {
  // Get text content from binary data
  let content = '';
  if (item.binary?.data) {
    content = Buffer.from(item.binary.data.data, 'base64').toString('utf-8');
  }
  
  return {
    title: item.json.name.replace('.md', ''),
    category: 'General', // Parse from folder structure if needed
    content: content,
    last_modified: item.json.modifiedTime
  };
});

return {
  json: {
    knowledge_base: {
      last_updated: new Date().toISOString(),
      document_count: documents.length,
      documents: documents
    }
  }
};
```

---

### Node 6: Return Knowledge Base

**Type**: `n8n-nodes-base.respondToWebhook`

(If called as subworkflow) OR just end the workflow if manual

---

## Workflow 3: vc-chatbot-stream

**Purpose**: Main orchestration with SSE streaming

### Node 1: SSE Webhook

**Type**: `n8n-nodes-base.webhook`

**Parameters**:
- Path: `vc-chat-stream`
- HTTP Method: POST
- Authentication: Header Auth (same as before)
- Response Mode: "Respond to Webhook"
- Response Headers:
  - Content-Type: `text/event-stream`
  - Cache-Control: `no-cache`
  - Connection: `keep-alive`

---

### Node 2: Authenticate & Parse

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
// Verify authentication
const authHeader = $input.item.json.headers.authorization;
if (!authHeader || authHeader !== `Bearer ${$env.N8N_WEBHOOK_SECRET}`) {
  throw new Error('Unauthorized');
}

const body = $input.item.json.body;

return {
  json: {
    message: body.message,
    conversation_id: body.conversationId,
    user_id: body.userId,
    timestamp: body.timestamp
  }
};
```

---

### Node 3: Execute Knowledge Base Workflow

**Type**: `n8n-nodes-base.executeWorkflow`

**Parameters**:
- Source: Database
- Workflow: `vc-chatbot-knowledge`

---

### Node 4: Build Claude Request

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
const message = $node["Authenticate & Parse"].json.message;
const knowledgeBase = $node["Execute Knowledge Base Workflow"].json.knowledge_base;

// Define CiviCRM tools (from specification)
const tools = [
  {
    name: "search_contacts",
    description: "Search for contacts in CiviCRM by name, email, organization, or other criteria.",
    input_schema: {
      type: "object",
      properties: {
        search_term: { type: "string", description: "Name, email, or organization to search for" },
        contact_type: { type: "string", enum: ["Individual", "Organization", "Household"] },
        limit: { type: "number", default: 10 }
      },
      required: ["search_term"]
    }
  },
  // ... add other 3 tools
];

// Build system prompt with knowledge base
const systemPrompt = `You are a helpful assistant for MAS volunteer consultants.

# Knowledge Base
${JSON.stringify(knowledgeBase, null, 2)}

When answering questions:
1. Use the knowledge base for general MAS information
2. Use CiviCRM tools only for client/case data
3. Cite sources from knowledge base
4. Be concise and helpful`;

return {
  json: {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    stream: true,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: message
      }
    ],
    tools: tools
  }
};
```

---

### Node 5: Call Claude API with Streaming

**Type**: `n8n-nodes-base.httpRequest`

**Parameters**:
- Method: POST
- URL: `https://api.anthropic.com/v1/messages`
- Authentication: Predefined Credential Type
  - Credential Type: Anthropic API
- Headers:
  - anthropic-version: `2023-06-01`
- Body: `{{JSON.stringify($json)}}`
- Options:
  - Response Format: Stream
  - Timeout: 120000 (2 minutes)

---

### Node 6: Process Stream & Handle Tool Calls

**Type**: `n8n-nodes-base.code`

**JavaScript Code**:
```javascript
// This is complex - SSE stream processing with tool calls
// Parse SSE events from Claude
// When tool_use event received, call civicrm-tool-handler
// Send tool results back to Claude
// Continue streaming

// Pseudo-code structure:
let streamText = '';
const toolCalls = [];

// Process each SSE event
// if (event.type === 'content_block_delta') {
//   streamText += event.delta.text;
//   // Forward to client via SSE
// }
// if (event.type === 'tool_use') {
//   // Call civicrm-tool-handler
//   // Get result
//   // Send back to Claude
// }

// This is the most complex part - see detailed implementation
// in actual workflow build
```

---

### Node 7: Forward Stream to Client

**Type**: `n8n-nodes-base.respondToWebhook`

**Parameters**:
- Respond With: Stream
- Response Body: SSE formatted events

---

## Testing Workflows

### Test civicrm-tool-handler

```bash
curl -X POST https://n8n.masadvise.org/webhook/civicrm-tool \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "search_contacts",
    "tool_input": {
      "search_term": "Smith",
      "limit": 5
    }
  }'
```

### Test vc-chatbot-knowledge

Execute manually in n8n UI, verify output format

### Test vc-chatbot-stream

```bash
curl -X POST https://n8n.masadvise.org/webhook/vc-chat-stream \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is MAS?",
    "conversationId": "test-123",
    "userId": 1,
    "timestamp": "2026-01-17T14:30:00Z"
  }'
```

---

## Exporting Workflows

After building in n8n UI:

1. Click workflow name → "..." menu → "Download"
2. Save to appropriate location:
   - `/workflows/vc-chatbot/civicrm-tool-handler.json`
   - `/workflows/vc-chatbot/vc-chatbot-knowledge.json`
   - `/workflows/vc-chatbot/vc-chatbot-stream.json`
3. Commit to git

---

**Last Updated**: 2026-01-17
**Next**: Build workflows in n8n UI using these templates
