# Email Research Agent - SKILL

## Purpose

The Email Research Agent mines Gmail for emails on a specific topic and generates a structured research report. This report serves as an input to other agents (like Presentation) or as the basis for composing follow-up emails.

## Core Workflow

1. **Receive Research Topic** - User specifies what to research
2. **Mine Gmail** - Search for relevant emails using Gmail MCP
3. **Analyze & Organize** - Extract key information and themes
4. **Generate Report** - Send structured report as HTML email (v0.1)
5. **Iterate via Email** - User replies with feedback, agent sends updated versions
6. **Finalize** - Report ready for use by other agents

## Input Requirements

### Research Topic Specification
The user provides:
- **Topic/Keywords**: What to search for (e.g., "boiler project", "parking policy", "marina permits")
- **Timeframe** (optional): How far back to search (default: 90 days)
- **Focus** (optional): Specific aspects to emphasize

### Natural Language Understanding
Understand various ways users express research requests:

- "Research everything about the boiler project"
- "Find all emails about parking"
- "What have we discussed about the marina permits?"
- "Pull together info on the budget discussions"

## Email Mining Strategy

### Gmail Account
- Account: `nickd@wharfsidemb.com`
- Default lookback: 90 days (configurable)
- All emails in this account are Wharfside Board-related

### Search Approach

1. **Primary Search**
   - Use topic keywords in Gmail search
   - Include variations and related terms
   - Search subject lines and body content

2. **Thread Expansion**
   - When finding relevant emails, include full thread context
   - Capture replies and follow-ups

3. **Sender Context**
   - Note who is involved in discussions
   - Identify key stakeholders

### Information Extraction

For each relevant email/thread, extract:
- **Date**: When the communication occurred
- **Participants**: Who was involved
- **Key Points**: Main information or decisions
- **Action Items**: Any tasks mentioned
- **Status Updates**: Progress or current state
- **Links/Attachments**: References to documents or resources
- **Open Questions**: Unresolved issues

## Report Structure

### Report Header
```
Email Research Report: [Topic]
Generated: [Date]
Timeframe: [Start Date] - [End Date]
Emails Analyzed: [Count]
```

### Executive Summary
A 2-3 paragraph overview covering:
- What the research is about
- Key findings at a glance
- Current status of the topic

### Timeline of Communications
Chronological list of key communications:
```
[Date] - [Subject/Summary]
  From: [Sender]
  Key Point: [Brief description]
```

### Key Themes & Findings

Organize discoveries into logical categories:

**Decisions Made**
- List of decisions with dates and context

**Action Items**
- Open tasks and their status
- Who is responsible
- Any deadlines mentioned

**Financial Information** (if applicable)
- Costs, budgets, quotes
- Payment timelines

**Technical Details** (if applicable)
- Specifications, requirements
- Vendor information

**Stakeholders**
- Internal: Board members, management
- External: Vendors, contractors, engineers

### Outstanding Questions
List of unresolved issues or items needing follow-up

### Source References
List of email threads used in the report:
- Thread subjects with dates
- Key participants

## Output Format

### Primary Output: HTML Email
Send research report as a professionally formatted HTML email:
- **To:** nickd@wharfsidemb.com
- **Subject:** `Email Research: [Topic] - Draft v{version}`
- **Format:** text/html for rich formatting

### Version Tracking
- **Draft versions:** v0.1, v0.2, v0.3, etc.
- Each revision increments the version number
- Version always appears in subject line for easy thread tracking

### Email-Based Iteration

**Initial Report (v0.1):**
1. Complete research and analysis
2. Send HTML email with full report
3. Subject: "Email Research: [Topic] - Draft v0.1"

**User Feedback:**
- User replies to the email with feedback
- Requests for additions, corrections, or focus changes
- Questions about findings

**Updated Versions (v0.2+):**
1. Process feedback from email reply
2. Update report accordingly
3. Send new email with incremented version
4. Subject: "Email Research: [Topic] - Draft v0.2"
5. Continue until user is satisfied

**Finalized Report:**
- When user approves, mark as final
- Subject: "Email Research: [Topic] - v1.0 FINAL"
- Ready for handoff to other agents

### Supplementary Outputs

**For Presentation Agent:**
When user indicates they want to create a presentation:
- Summarize findings into presentation-ready bullet points
- Highlight key data points and decisions
- Suggest slide structure

**For Email Composition:**
When user wants to draft a follow-up email:
- Provide context summary
- List key points to address
- Suggest recipients based on stakeholder analysis

## Usage Examples

### Basic Research Request
```
User: Research the boiler project

Agent: I'll search your emails for information about the boiler project.

[Searches Gmail, analyzes results]

I found 23 emails about the boiler project spanning October through January.
Sending research report v0.1 to your email now...

[Sends HTML email report]

Sent: "Email Research: Boiler Project - Draft v0.1"

Key findings:
- Alexander Plumbing selected as contractor
- Phase 1 (Unit inspections) completed in November
- Phase 2 (common area work) scheduled for February
- Total budget: $47,500

Reply to the email with any feedback or changes you'd like.
```

### Email-Based Iteration
```
[User replies to email: "Can you add more detail about the Phase 2 timeline
and include the contact info for Alexander Plumbing?"]

Agent: I'll update the report with Phase 2 timeline details and vendor contact info.

[Updates report content]
[Sends new email]

Sent: "Email Research: Boiler Project - Draft v0.2"

Added:
- Detailed Phase 2 timeline (February 10-28)
- Alexander Plumbing contact: 732-422-2424
- Project manager: Mike Alexander

Reply with further feedback or let me know when it's ready to finalize.
```

### Finalizing a Report
```
User: The boiler research report looks good, let's finalize it.

Agent: Marking the report as final.

[Sends final version email]

Sent: "Email Research: Boiler Project - v1.0 FINAL"

The research report is now finalized. Would you like me to:
- Create a presentation from these findings?
- Help draft a status update email?
```

### Research-to-Presentation Flow
```
User: Research marina permits and create a presentation for the board

Agent: I'll research marina permits and then create a presentation.

[Step 1: Research and send email report]
[Step 2: User reviews and approves report]
[Step 3: Hand off to Presentation agent with research context]
```

## Quality Standards

### Completeness
- Capture all relevant communications
- Don't miss important threads
- Include context from thread replies

### Accuracy
- Quote specific figures and dates accurately
- Attribute information to correct sources
- Note when information is uncertain or incomplete

### Organization
- Logical flow of information
- Clear section headers
- Easy to scan and navigate

### Actionability
- Highlight next steps clearly
- Identify open questions
- Connect findings to potential actions

## Handoff to Other Agents

### To Presentation Agent
Provide:
- Topic summary
- Key data points (numbers, dates, names)
- Suggested slide structure
- Visual elements (charts, timelines)

### To Email Composition
Provide:
- Context summary
- Points to address
- Suggested tone
- Recipient recommendations

## Error Handling

### No Results Found
If search returns no relevant emails:
- Confirm search terms with user
- Suggest alternative keywords
- Offer to expand timeframe

### Too Many Results
If search returns overwhelming results:
- Ask user to narrow focus
- Suggest specific aspects to prioritize
- Offer to break into multiple reports

### Ambiguous Topics
If topic is unclear:
- Ask clarifying questions
- Present options for interpretation
- Start with broader search and refine

## Success Criteria

The Email Research Agent is working correctly when:

- User can request research on any topic
- Agent finds and organizes relevant emails
- Report is comprehensive and well-structured
- Findings are accurate and properly attributed
- User can easily use report for next steps
- Handoff to other agents is smooth
