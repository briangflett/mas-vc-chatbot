# AI for Nonprofits - Advanced Techniques

Source: https://www.masadvise.org/finance-and-it/ai/ai-for-nonprofits-advanced-techniques/

[Skip to content](https://www.masadvise.org/finance-and-it/ai/ai-for-nonprofits-advanced-techniques/#content)

- [AI](https://www.masadvise.org/category/finance-and-it/ai/)

## AI for Nonprofits – Advanced Techniques

- October 14, 2025
- [BY\\
Brian Flett](https://www.masadvise.org/author/brian-flettmasadvise-org/)

![](https://www.masadvise.org/wp-content/uploads/2025/10/AI-for-Nonprofits-Advanced-Techniques.png)

_This is the second article in our “AI for Nonprofits” series. If you’re new to AI, read_ [_Part 1: Getting Started_](https://www.masadvise.org/finance-and-it/ai/ai-for-nonprofits-getting-started/) _first._

## Introduction

If you’re comfortable with basic prompting, you’ve found some helpful use cases, and you’re starting to wonder: “What else can these tools do?”, this article is for you.  It explores advanced techniques that transform AI from a helpful assistant into a true productivity multiplier for nonprofit work, referencing examples from both ChatGPT and Claude.

The most important skill in using AI tools is knowing how to structure your prompt and provide context.  We’ll expand beyond the basics that were covered in Part 1, and then introduce advanced tools to

- Collaborate on files
- Leverage image, voice, and video
- Let AI spend more time in deep research
- Handle sensitive information

## Advanced Prompting Techniques

There are a number of different techniques for improving the quality of your prompt.  If you apply several of these into your initial prompt, you will get to a higher quality response much faster.

### **1\. Chain-of-Thought Prompting**

**When to use:** Complex decisions, budget planning, strategic analysis

**Instead of:** “Should we hire a part-time marketing coordinator?”

**Try:** “Think step-by-step through whether we should hire a part-time marketing coordinator. Consider: our current capacity, budget constraints, priority initiatives for next year, and alternative solutions. Show your reasoning for each factor.”

**Result:** You get the reasoning process, not just a yes/no answer. This helps you spot flawed assumptions or missed considerations.

### **2\. Role-Based Prompting**

**When to use:** Getting critical feedback, preparing for stakeholder conversations

**Instead of:** “Review this grant proposal”

**Try:** “Act as a skeptical foundation program officer who’s seen 200 proposals this month. Review our proposal critically. What concerns would you have? What would make you hesitate to fund this? Be blunt.”

**Result:** Honest feedback you won’t get from colleagues who don’t want to discourage you.

### **3\. Structured Output Requests**

**When to use:** Comparing options, presenting to leadership, documenting decisions

**Instead of:** “What are our options for volunteer management software?”

**Try:** “Research volunteer management software options suitable for a small nonprofit. Present findings in a table with columns for: Software Name, Monthly Cost (50 volunteers), Key Features, Limitations, Best For. Include 4-5 options.”

**Result:** Scannable comparison that makes decisions easier.

### **4\. Style Matching**

**When to use:** Maintaining brand voice, matching existing materials

**Instead of:** “Write a newsletter article about our new literacy program”

**Try:** “Here are three newsletter articles from our archives: \[paste examples\]. Notice the conversational tone, 2-3 sentence paragraphs, and personal stories. Write a new article about our literacy program in this same style.”

**Result:** Content that sounds like YOU, not generic AI writing.

### **5\. Iterative Refinement**

The secret: First drafts are starting points, not final products.

**Workflow:**

1. Get initial response
2. Identify what’s wrong: “This is too formal” or “Add more specific examples”
3. Request changes: “Rewrite in a friendlier tone with 2-3 concrete examples”
4. Repeat 2-3 times

**Example conversation:**

**You:** “Write a volunteer recruitment email”

**AI:** \[Generates generic email\]

**You:** “Too corporate. Make it warmer and mention we provide free pizza at shifts”

**AI:** \[Generates warmer version\]

**You:** “Better. Now add a specific story about one current volunteer”

**AI:** \[Generates final version\]

Don’t accept the first draft. Good AI users iterate.

## Managing Context and Memory

AI tools maintain context throughout a conversation and use the instructions from your account profile and project.  As tools improve, they are starting to develop “memory”.

**ChatGPT** automatically builds memories from your conversations. It remembers things like “I work at an animal shelter in Calgary” or “I prefer formal email tone.” Check Settings > Personalization > Memory to see what it’s retained. Delete memories that are outdated or incorrect.

**Claude** lets you explicitly search past conversations and reference relevant discussions. Ask: “Search my previous chats about donor retention and summarize key insights.” That summary becomes available for your current conversation.

Both tools also allow you to attach files or ask them to access specific web links.  Take advantage of this to include:

- ✅ Your organization’s strategic plan (or 1-page summary)
- ✅ Link to your website
- ✅ Relevant past reports or data
- ✅ Style guides or brand standards
- ✅ Previous successful examples (grants, campaigns, emails)

**How much can AI handle?**

- **Free tiers:** ~10-20 pages of text per conversation
- **Paid tiers:** ~100-150 pages of text per conversation

If you have more than 100 pages, use this two-step approach:

1. “Here are 5 evaluation reports from the past 3 years. Read them and identify common themes in participant feedback.”
2. \[AI provides summary\] “Now using those themes, draft a theory of change for our updated program model.”

**💡 Pro tip:** Organize your conversations into projects, and attach files to your projects for automatic context in every conversation. Update these quarterly.

## Collaborating on Files

AI generates great first drafts, but you’ll always need to revise. Here’s how to create content you can edit, share with colleagues, and refine collaboratively.

### **Document Workspaces**

**ChatGPT Canvas** (ChatGPT Plus)

A side-by-side editor that appears when you ask ChatGPT to create longer content like proposals, policies, or reports.

How to use:

1. “Create a volunteer handbook covering safety, scheduling, and communication policies”
2. ChatGPT generates content in Canvas (side panel)
3. Edit directly in the panel OR ask for changes: “Make section 2 more concise”
4. Click “Copy” to move final version to Google Docs

**Claude Artifacts** (Free & Pro)

Similar side-panel workspace for documents, code, and websites.

How to use:

1. “Create a donor survey with 10 questions about communication preferences”
2. Claude generates content in Artifacts panel
3. Describe changes: “Add a question about preferred donation methods”
4. Copy final version to your tools

**Best practices:**

- Use these for content >200 words that needs editing
- Don’t use for simple Q&A or quick tasks
- Export to Google Docs for team collaboration
- Treat AI output as a first draft, not final copy

### **Shared Conversations**

Both platforms allow sharing conversations via link. This lets you collaborate with colleagues or show stakeholders your AI-assisted work process.

### **Custom GPTs**(ChatGPT Plus)

Think of these as AI team members trained on your specific needs.

**What they are:**

Pre-configured ChatGPT instances with:

- Custom instructions (your organization’s context)
- Uploaded files (case for support, brand guide, past proposals)
- Specific capabilities (always search web, always be formal, etc.)
- Shareable links (anyone can use without rebuilding context)

**Example: Grant Writing Assistant**

What you configure once:

- **Instructions:** “You’re a grant writer for \[Org Name\]. We serve low-income seniors in Calgary. Our mission is \[X\]. Always write in narrative style with specific examples. Budget requests should include justification.”
- **Uploads:** 3 successful grant proposals, case for support, program evaluation data
- **Capabilities:** Web search enabled (for funder research)

What your team can do:

- “Draft a proposal for the Smith Foundation’s community impact grant” → customized output every time
- “Research foundations funding senior services in Alberta”
- “Analyze this RFP and identify our strongest matches to their criteria”

**Other useful Custom GPTs:**

- **Social Media Manager:** Loaded with brand voice, past posts, content calendar
- **Board Report Writer:** Knows your KPIs, strategic plan, standard report format
- **Volunteer Coordinator:** Has volunteer handbook, FAQ, scheduling policies
- **Event Planner:** Loaded with past event rundowns, vendor lists, templates

**How to create:** ChatGPT Plus → Explore GPTs → Create (5-minute setup, reusable forever)

## Beyond Text: Images, Voice, and Video

AI tools now work with images, voice, and video—not just text. Here’s what actually matters for nonprofits.

### **Analyzing Images You Upload**

**What AI can do:**

- Convert whiteboards/flipcharts to digital text
- Transcribe handwritten forms
- Generate captions for event photos
- Extract data from charts/infographics
- Analyze competitor materials

**Real example:**

Upload photo of whiteboard from strategy session → “Transcribe this whiteboard, organize ideas into themes, identify top 3 priorities, and create action items for each.”

**Quality expectations:**

- ✅ Great for: Printed text, clear handwriting, well-lit photos
- ⚠️ Mediocre for: Messy handwriting, poor lighting, complex diagrams
- ❌ Fails at: Tiny text, obscured content, artistic interpretation

**Honest assessment:** Image upload sounds futuristic but has practical uses. The most valuable: photograph whiteboards after strategy sessions and ask AI to transcribe and organize ideas by theme. This beats typing notes for 45 minutes after every meeting. Event photo captioning and handwritten form transcription work but aren’t dramatic time-savers—test them, but don’t expect miracles.

### **Generating Images**

Create custom graphics for social media, presentations, and marketing materials.

**ChatGPT** supports image generation directly. Try “Create an image showing diverse volunteers at a food bank with warm, welcoming lighting.”

**Claude** does not generate images, but it does have integration with Canva.

**Recommendation:** Canva is an excellent design tool that provides access to a large library of professional images, and includes the ability to use AI to generate your own images.  Canva provides a [free license](https://www.canva.com/canva-for-nonprofits) for nonprofits.  Personally, I find Canva a better tool than ChatGPT or Claude for finding or generating images.

### **Voice Mode**(Mobile Apps)

Both Claude and ChatGPT support voice mode for hands-free interaction in their mobile apps.  Dictate instead of typing—perfect after site visits, during meetings, or when multitasking.

**Basic Voice Mode (Free):** Transcribes your speech and responds in text. Works well for dictation and straightforward queries.

**Advanced Voice Mode (ChatGPT Plus / Claude Pro):** Conversational AI with natural interruptions, emotional tone recognition, and fluid dialogue. It’s like talking to a colleague.

**Nonprofit use cases:**

- Dictating meeting notes while facilitating
- Capturing ideas during site visits
- Hands-free brainstorming while commuting
- Accessibility for team members who prefer speaking

## Deep Research & Data Analysis

### **Extended Thinking & Deep Research**

Claude’s extended thinking mode takes extra time to reason through complex problems, showing its thinking process. This is valuable for nuanced analysis, strategic decisions, and multi-faceted problems.Chat GPT has two tools, Think Longer and Deep Research.  Think longer spends more time analyzing and collecting ideas from its existing knowledge base before generating the response, while deep research adds web search to do extended thinking using the latest information available on the internet.

**Research process:**

1. You pose a research question
2. AI creates a research plan
3. Conducts multiple searches
4. Synthesizes findings
5. Provides comprehensive report with citations

**Nonprofit applications:**

- Best practices in volunteer retention (with current data)
- Funding landscape for environmental education in Ontario
- Sector trends in youth mental health programs
- Comparative analysis of similar organizations

### **Data Analysis**

Upload CSV or Excel files to segment donors, analyze attendance trends, identify retention patterns, or spot program outcomes.

**Analytical capabilities:**

- Statistical analysis and visualizations
- Trend identification
- Segmentation and clustering
- Predictive insights
- Data cleaning and preparation

**Example:** “I’ve uploaded 3 years of donor data. Analyze retention patterns. What percentage of first-time donors give again? Which donor segments have the highest lifetime value? Create visualizations showing trends.”

## Privacy & Security

### **Incognito Mode**(ChatGPT Plus / Claude Pro)

Paid subscriptions offer private conversation modes where:

- Nothing is saved to your conversation history
- Data isn’t used for training AI models
- Conversations are deleted when you close them

**When to use incognito:**

- Sensitive strategic planning
- Confidential financial analysis
- Personnel discussions
- Competitive intelligence
- When you need to use personal information, for example to research potential donors.

### **What Never to Share**

Even in incognito mode, avoid sharing:

- Banking details or financial credentials
- Social Insurance Numbers or health information
- Proprietary strategy that would harm you if disclosed
- Information subject to confidentiality agreements

**Use placeholders:** Replace sensitive data with “\[Donor Name\]”, “\[Amount\]”, or “\[Client ID\]” when seeking AI assistance.

### **Establishing Organizational Policies**

Create guidelines for your nonprofit:

**Approved Tools:** Which AI platforms are acceptable for organizational use?

**Prohibited Information:** What data should never be shared with AI?

**Privacy Settings:** Required privacy configurations before use.

**Approval Requirements:** Which activities require supervisor approval?

**Review Processes:** How AI-generated content should be reviewed before publication.

**Action Step:** Draft a one-page AI usage policy for your organization covering these five areas.

## **Conclusion: From User to Power User**

The difference between AI users and AI power users isn’t just access to premium features—it’s understanding when and how to apply advanced techniques strategically.  Start experimenting with the advanced techniques identified above, and subscribe to updates from your AI tool provider so you get informed as new features and capabilities get rolled out.

### **Questions? Want to go deeper?**

🎓 Register for our “ [Practical Use of AI for Nonprofits](https://www.masadvise.org/civicrm/event/info/?reset=1&id=22)” workshop

🤝 Request [personalized AI consulting](https://www.masadvise.org/contact-us/#request-for-assistance) from our expert team

_Our next blog will cover Connectors, Workflow Automation, and AI Agents._

![Picture of Brian Flett](https://secure.gravatar.com/avatar/40c4ccedd0afc740cb168fd261f764c11b8cb1ab6b145c783737cee503c0a5ab?s=300&d=mm&r=g)

#### Brian Flett

Brian has a background in IT Consulting, Operations Management, and Software Product Management. His focus is on helping non-profits better leverage technology to help drive toward their mission, with a particular focus on the adoption and safe use of AI.

Search

[Facebook-f](https://masadvise.org/facebook)[Linkedin-in](https://masadvise.org/linkedin)[Twitter](https://masadvise.org/twitter)

quick links

[**» Resources**](https://www.masadvise.org/resources)

[**» Webinars**](https://www.masadvise.org/mas-webinars)

[**» Workshops**](https://www.masadvise.org/about/workshops)

[**» Publications**](https://www.masadvise.org/mas-publications)

[**» Presentations**](https://www.masadvise.org/presentations-about-MAS)

[View Services](https://www.masadvise.org/services-strategic-planning-and-facilitation)

### [View Services](https://www.masadvise.org/services-strategic-planning-and-facilitation)

Check out what we offer.

[Our team](https://www.masadvise.org/our-team)

### [Our team](https://www.masadvise.org/our-team)

Meet the MAS team.

[Donate Today](https://www.canadahelps.org/dn/9753)

### [Donate Today](https://www.canadahelps.org/dn/9753)

Help us to do more.

[Any Questions?](https://www.masadvise.org/contact-us)

### [Any Questions?](https://www.masadvise.org/contact-us)

Contact us today!

Related articles

[![](https://www.masadvise.org/wp-content/uploads/2025/09/Practical-Use-of-AI-for-NonProfits.jpg)](https://www.masadvise.org/finance-and-it/ai/ai-for-nonprofits-getting-started/)

### [AI for Nonprofits – Getting Started](https://www.masadvise.org/finance-and-it/ai/ai-for-nonprofits-getting-started/)

[![Refresh strategy](https://www.masadvise.org/wp-content/uploads/2022/09/Refresh-graphic.webp)](https://www.masadvise.org/strategic-planning-and-facilitation/strategic-planning/strategy-refresh-our-strategy-is-still-good-do-we-need-to-start-from-scratch/)

### [Strategy Refresh – Our Strategy is still good – do we need to start from scratch?](https://www.masadvise.org/strategic-planning-and-facilitation/strategic-planning/strategy-refresh-our-strategy-is-still-good-do-we-need-to-start-from-scratch/)

[![](https://www.masadvise.org/wp-content/uploads/2020/10/1coronavirus-5154115_1920-300x169.jpg)](https://www.masadvise.org/strategic-planning-and-facilitation/strategic-planning/scenario-planning-how-can-i-do-a-3-5-year-strategic-plan-when-i-dont-know-what-will-happen-next-month/)

### [Scenario Planning – How can I do a 3-5 year Strategic Plan when I don’t know what will happen next month?](https://www.masadvise.org/strategic-planning-and-facilitation/strategic-planning/scenario-planning-how-can-i-do-a-3-5-year-strategic-plan-when-i-dont-know-what-will-happen-next-month/)

[![](https://www.masadvise.org/wp-content/uploads/2020/07/Blog-July-20-2-300x216.png)](https://www.masadvise.org/governance/why-evaluate-your-programs/)

### [Why Evaluate your Programs?](https://www.masadvise.org/governance/why-evaluate-your-programs/)

[![](https://www.masadvise.org/wp-content/uploads/2020/07/Blog-July-20-300x199.png)](https://www.masadvise.org/finance-and-it/finance-and-accounting/financial-literacy-for-boards/)

### [Financial Literacy for Boards](https://www.masadvise.org/finance-and-it/finance-and-accounting/financial-literacy-for-boards/)

## Some of our happy clients

### Amazing Support

Thank you for the amazing support that you provided us during the past year for our Strategic Planning and Performance Management System.

**Kristin Griffith**

Executive Director, Harmony Hall

### Absolutely Amazing

The ArtHeart Board has approved the strategic plan and is in the process of setting up committees and actually doing the items within the plan — so it's underway. You were absolutely amazing in guiding us through the process.

**Seanna Connell**

Co-Chair, ArtHeart Community Art Centre

### Fantastic Job

MAS has done a fantastic job of facilitating working sessions that have resulted in real agreement and results. I would highly recommend MAS to any agency seeking support for this type of work.

**Anne Babcock**

COO at WoodGreen