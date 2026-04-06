# VC Chatbot Knowledge Base - Setup Guide

**Last Updated**: 2026-01-17
**Purpose**: Guide for creating and maintaining the Google Drive knowledge base

---

## Overview

The knowledge base provides the chatbot with MAS-specific information that isn't available in CiviCRM or general AI training data. This guide explains how to set up and maintain the knowledge base.

---

## Google Drive Folder Structure

Create this folder structure in Google Drive:

```
VC Chatbot Knowledge Base/
├── Core Information/
│   ├── about-mas.md
│   ├── consultant-guidelines.md
│   └── services-overview.md
│
├── Workflows/
│   ├── client-intake-process.md
│   ├── project-management.md
│   └── case-management.md
│
└── Technical/
    ├── civicrm-guide.md
    ├── vc-portal-guide.md
    └── tools-and-resources.md
```

**Share Settings**:
- Grant n8n service account read access
- Grant all VCs edit access
- Set permissions at folder level

---

## Document Templates

Below are templates for each knowledge base document. Copy these into Google Docs in the appropriate folders.

### 1. about-mas.md

```markdown
# About Management Advisory Service (MAS)

**Last Updated**: [Date]

## Mission

MAS provides free business and technology consulting services to micro-enterprises and small nonprofits in Ontario through a network of volunteer consultants.

## Who We Serve

- Micro-enterprises (businesses with <5 employees)
- Small nonprofits and charities
- Social enterprises
- Community organizations
- Startups with social mission

**Geographic Focus**: Ontario, Canada (primarily GTA)

## Our Services

### Business Advisory
- Strategic planning
- Marketing and branding
- Financial management
- Operations optimization
- Governance support

### Technology Consulting
- CiviCRM implementation and support
- Website development (WordPress)
- Automation and workflow optimization
- AI adoption guidance
- Technology needs assessment

### Training & Workshops
- Group training sessions
- One-on-one skills development
- Webinars and online resources
- Peer learning opportunities

## How We Work

**Volunteer Model**: All services provided by experienced professionals volunteering their time

**Client Engagement**: Typically 10-40 hours per engagement over 3-6 months

**No Cost**: All services are free to qualified organizations

**Collaborative**: Work alongside client teams to build internal capacity

## Our Impact

[Add statistics about:
- Number of clients served
- Hours of consulting provided
- Success stories
- Client testimonials]

## Contact Information

- **Website**: [URL]
- **Email**: [Email]
- **Office**: [Address if applicable]

---

*For volunteer consultant guidelines, see consultant-guidelines.md*
```

### 2. consultant-guidelines.md

```markdown
# Volunteer Consultant Guidelines

**Last Updated**: [Date]

## Role Overview

As a MAS volunteer consultant (VC), you provide professional expertise to help micro-enterprises and nonprofits achieve their goals while building your skills and giving back to the community.

## Time Commitment

- **Typical Engagement**: 10-40 hours over 3-6 months
- **Flexibility**: Work around your schedule
- **Minimum**: 2-4 hours per month during active engagement
- **Maximum**: 10 hours per week (to avoid volunteer burnout)

## Code of Conduct

### Professionalism
- Treat all clients with respect and dignity
- Maintain professional boundaries
- Honor time commitments
- Respond to communications within 48 hours

### Confidentiality
- Keep all client information confidential
- Do not share client details outside MAS
- Use CiviCRM appropriately (no data export without permission)
- Follow privacy best practices

### Independence
- Provide objective advice
- Disclose conflicts of interest
- No selling your own services
- No commission-based referrals

### Quality
- Work within your expertise
- Refer to specialists when needed
- Seek guidance from MAS staff when uncertain
- Deliver what you promise

## Expectations

### From You
- Attend orientation/training
- Complete projects you commit to
- Track time accurately in CiviCRM
- Report issues or concerns promptly
- Provide feedback on MAS processes

### From MAS
- Clear project scope and expectations
- Staff support and guidance
- Access to tools and resources
- Recognition and appreciation
- Professional development opportunities

## Best Practices

### Client Engagement
1. **Discovery Phase**: Understand client needs before proposing solutions
2. **Clear Scope**: Define deliverables, timeline, and success metrics
3. **Regular Check-ins**: Weekly or bi-weekly updates
4. **Documentation**: Keep notes in CiviCRM activities
5. **Knowledge Transfer**: Build client capacity, don't create dependency

### Communication
- Use client's preferred method (email, phone, video)
- Be responsive but set boundaries
- Keep MAS staff informed of progress
- Flag issues early

### Time Management
- Log all hours in CiviCRM (including prep and follow-up)
- Don't over-commit
- It's OK to say no or refer to another VC
- Take breaks between engagements to avoid burnout

## When Things Go Wrong

### Client Challenges
- **Scope creep**: Refer back to original agreement, involve MAS staff
- **Unresponsive client**: Document attempts, discuss with MAS
- **Unrealistic expectations**: Reset expectations early, involve MAS staff
- **Project can't proceed**: It's OK to gracefully exit with MAS support

### Personal Challenges
- **Too busy**: Communicate early, we can reassign or extend timeline
- **Out of depth**: Ask for help, we can bring in another VC
- **Personality conflict**: Discuss with MAS staff, can reassign
- **Burnout**: Take a break, your wellbeing matters

## Resources Available

- MAS staff support (email/phone)
- VC peer network (Slack/email list)
- This knowledge base (chatbot)
- Tools: CiviCRM, VC Portal, [others]
- Professional development opportunities

## Recognition

We value your contribution! You'll receive:
- Completion certificates for engagements
- LinkedIn recommendations (if desired)
- Annual volunteer recognition event
- Portfolio-worthy case studies (with client permission)
- Professional development opportunities

---

*Questions? Contact [MAS staff email]*
```

### 3. client-intake-process.md

```markdown
# Client Intake Process

**Last Updated**: [Date]

## Overview

This document outlines the step-by-step process for onboarding new clients to MAS.

## Step 1: Initial Inquiry

**Who**: Client contacts MAS via website form, email, or referral

**Actions**:
1. MAS staff reviews inquiry
2. Determines if client qualifies (micro-enterprise or small nonprofit in Ontario)
3. If qualified → proceed to Step 2
4. If not qualified → provide referrals to other resources

**Timeline**: Within 2 business days

## Step 2: Intake Call

**Who**: MAS staff + potential client

**Purpose**: 
- Understand client needs and challenges
- Explain MAS services and process
- Determine if we can help

**Duration**: 30-45 minutes

**Outcome**: 
- Proceed to matching OR
- Refer to other resources OR
- Add to waitlist

## Step 3: CiviCRM Setup

**Who**: MAS staff

**Actions**:
1. Create contact record in CiviCRM
2. Create case record (Case Type: [appropriate type])
3. Document needs and goals
4. Upload any client-provided documents

**Required Information**:
- Organization name
- Contact person details
- Organization description
- Specific needs/challenges
- Timeline expectations
- Any special considerations

## Step 4: Consultant Matching

**Who**: MAS staff identifies appropriate VC

**Matching Criteria**:
- Skills match (business, tech, etc.)
- Availability
- Geographic proximity (if in-person desired)
- Industry experience (if relevant)
- Language (if needed)

**Timeline**: Within 1 week of intake call

## Step 5: Introduction

**Who**: MAS staff facilitates intro between VC and client

**Format**: Email introduction with both parties CC'd

**Includes**:
- Client background and needs
- VC background and expertise
- Next steps (VC schedules kickoff meeting)
- MAS staff contact for support

## Step 6: Kickoff Meeting

**Who**: VC + client (MAS staff optional)

**Purpose**:
- Get to know each other
- Clarify project scope
- Set expectations and timeline
- Establish communication preferences

**Deliverable**: Project plan documented in CiviCRM

## Step 7: Ongoing Engagement

**VC Responsibilities**:
- Regular client meetings/check-ins
- Log all activities in CiviCRM
- Track hours
- Update case status
- Flag issues to MAS staff

**MAS Staff Responsibilities**:
- Monitor case progress
- Provide support to VC as needed
- Check in with client mid-engagement
- Address any issues

## Step 8: Project Completion

**Actions**:
1. VC completes deliverables
2. Final meeting with client
3. VC documents outcomes in CiviCRM
4. Client completes feedback survey
5. Case status updated to "Completed"
6. VC receives recognition/certificate

**Follow-up**: 3-month check-in to see if client needs further support

---

## CiviCRM Workflow

### Required Fields for New Case

- **Case Type**: [Select appropriate type]
- **Subject**: Brief description (e.g., "Website redesign for ABC Nonprofit")
- **Client Contact**: Link to organization contact
- **Status**: "Open"
- **Start Date**: Today
- **Details**: Detailed description of needs and goals

### Required Activities

1. **Initial Inquiry** (type: Phone Call or Email)
2. **Intake Meeting** (type: Meeting)
3. **VC Assignment** (type: Administrative)
4. **Kickoff Meeting** (type: Meeting)
5. [Regular activities throughout engagement]
6. **Project Completion** (type: Administrative)

### Time Tracking

- Log all hours in activities (including prep, meetings, follow-up)
- Use standard activity types
- Include brief description of work done

---

*For ongoing case management, see case-management.md*
```

### 4. civicrm-guide.md

```markdown
# CiviCRM Quick Reference for VCs

**Last Updated**: [Date]

## Overview

CiviCRM is our client relationship management system. This guide covers common tasks VCs need to perform.

## Accessing CiviCRM

**URL**: [CiviCRM URL]
**Login**: Use your VC Portal credentials

## Common Tasks

### Finding a Contact

**Option 1: Search Bar** (top of screen)
- Type name, email, or organization
- Select from dropdown results

**Option 2: Advanced Search**
1. Navigate to Search > Find Contacts
2. Enter search criteria
3. Click Search

### Viewing Contact Details

1. Search for contact
2. Click contact name
3. Tabs show: Summary, Activities, Cases, Notes, etc.

### Logging an Activity

**From Contact Record**:
1. Open contact record
2. Click "Actions" → "Record Activity"
3. Select activity type (Meeting, Phone Call, Email)
4. Enter details
5. Set duration (for time tracking)
6. Click Save

**From Case Record**:
1. Open case record
2. Click "Add Activity" button
3. Follow same steps as above
4. Activity is automatically linked to case

### Activity Types for VCs

| Type | When to Use |
|------|-------------|
| Meeting | In-person or video meetings |
| Phone Call | Phone conversations |
| Email | Significant email exchanges |
| Administrative | Internal tasks (prep, research, documentation) |
| Document | Creating/sharing documents |
| Follow-up | Scheduled follow-ups |

### Viewing Your Cases

1. Navigate to Cases > Find Cases
2. Filter: "Case Manager" = Your Name
3. Click Search
4. Results show all your assigned cases

### Updating Case Status

1. Open case record
2. Click "Edit" button
3. Change "Status" field:
   - Open (initial state)
   - In Progress (actively working)
   - On Hold (waiting for client or external factor)
   - Completed (finished)
   - Cancelled (did not complete)
4. Click Save

### Adding Case Notes

1. Open case record
2. Click "Add Activity" → Type: "Administrative"
3. Subject: "Project notes" or similar
4. Details: Your notes
5. Click Save

### Time Tracking

**Logging Hours**:
- Every activity has a "Duration" field
- Enter time in minutes
- Be honest and accurate
- Include prep, meetings, follow-up, documentation

**Viewing Your Hours**:
1. Navigate to Reports > Activity Reports
2. Filter by your name and date range
3. View total hours

### File Attachments

**Attaching Files to Contact/Case**:
1. Open contact or case record
2. Click "Attachments" tab
3. Click "Attach File"
4. Upload document
5. Add description
6. Click Save

## Custom Fields (MAS-Specific)

### Contact Custom Fields
- **Preferred Contact Method**: Email, Phone, Text
- **Industry**: [Various options]
- **Organization Size**: Number of employees
- **Primary Challenge**: Brief description

### Case Custom Fields
- **Project Budget**: If applicable
- **Expected Completion**: Target date
- **VC Assigned**: Your name (auto-populated)
- **Client Satisfaction**: [Rating after completion]

## Tips & Best Practices

### Documentation
- Log every interaction (even quick emails)
- Use clear, professional language
- Include action items and next steps
- Document outcomes and decisions

### Search Tips
- Use partial names: "Smi" finds "Smith", "Smythe"
- Use wildcards: "John*" finds "John", "Johnny", "Johnathan"
- Try organization name if person name doesn't work
- Check for duplicates before creating new contact

### Data Quality
- Update contact info if you learn it's changed
- Merge duplicate contacts (contact MAS staff for help)
- Add notes about communication preferences
- Flag data quality issues to MAS staff

### Privacy
- Only access contacts/cases you're working with
- Don't export contact lists
- Don't share login credentials
- Log out when done

## Troubleshooting

### Can't find a contact
- Try searching by organization name
- Check Advanced Search with broader criteria
- Contact MAS staff - they can search deleted/archived records

### Can't log an activity
- Make sure you have permission (should be granted)
- Try from case record instead of contact record
- Check if required fields are filled
- Contact MAS staff if problem persists

### Case not showing in your list
- Check case manager assignment
- Try "All Cases" view instead of "My Cases"
- Verify case status (closed cases may be hidden)
- Contact MAS staff

### Forgot to log time
- Can edit past activities to add duration
- Don't worry about being exact (estimate reasonably)
- Better to log something than nothing

## Getting Help

**For technical issues**:
- Contact MAS staff: [email/phone]
- Use VC chatbot: "How do I [task] in CiviCRM?"

**For CiviCRM training**:
- Watch training videos: [link if available]
- Attend office hours: [schedule if available]
- Ask fellow VCs in Slack/email list

---

*For process questions, see consultant-guidelines.md and case-management.md*
```

---

## n8n Knowledge Fetcher Implementation

When implementing the n8n workflow to fetch this knowledge base, use this approach:

### Workflow: vc-chatbot-knowledge.json

**Trigger**: Called by main streaming workflow

**Steps**:
1. **List files** in Google Drive folder
2. **Loop through** markdown files
3. **Fetch content** for each file
4. **Format** as structured JSON
5. **Cache** results (24 hours)
6. **Return** consolidated knowledge base

### Output Format

```json
{
  "knowledge_base": {
    "last_updated": "2026-01-17T14:30:00Z",
    "documents": [
      {
        "title": "About MAS",
        "category": "Core Information",
        "content": "[full markdown content]",
        "last_modified": "2026-01-15"
      },
      {
        "title": "Consultant Guidelines",
        "category": "Core Information",
        "content": "[full markdown content]",
        "last_modified": "2026-01-10"
      }
      // ... more documents
    ]
  }
}
```

### System Prompt Usage

The consolidated knowledge base is included in the Claude system prompt:

```
You are a helpful assistant for MAS volunteer consultants.

# Knowledge Base
[Include formatted knowledge base here]

When answering questions:
1. First check the knowledge base
2. Use CiviCRM tools only for client/case data
3. Cite sources (e.g., "According to the Consultant Guidelines...")
4. If unsure, say so - don't make up information
```

---

## Maintenance

### Update Frequency
- **Core documents**: Review quarterly
- **Process documents**: Update when processes change
- **Technical guides**: Update with tool changes

### Quality Checks
- All links work
- Information is current
- Consistent formatting
- No sensitive information included

### Feedback Loop
- VCs can suggest updates via chatbot
- MAS staff reviews suggestions monthly
- Version control via Google Docs history

---

**Last Updated**: 2026-01-17
**Next Review**: 2026-04-17
**Owner**: MAS Staff + VC Community
