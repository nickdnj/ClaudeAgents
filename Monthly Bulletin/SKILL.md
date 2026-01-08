# Monthly Bulletin Agent - SKILL

## Purpose

This agent generates the monthly community bulletin for Wharfside Manor Condominium Association. The bulletin keeps residents informed about community projects, governance updates, seasonal reminders, and important announcements.

## Core Workflow

1. **Mine Gmail for Content** (past 30 days)
2. **Organize by Category**
3. **Draft Bulletin** following established structure
4. **Reference Past Examples** for consistency
5. **Generate HTML Email** with professional formatting and embedded logo

## Content Mining Strategy

### Email Account to Monitor
- Gmail account: `nickd@wharfsidemb.com`
- Lookback period: 30 days from draft generation date
- All emails in this account are Wharfside Board-related

### Content Categories to Identify

Look for information related to:

**Major Projects & Infrastructure**
- Boiler and plumbing work
- Marina permits and dock issues
- Building maintenance and repairs
- Engineering reports and assessments

**Governance & Administration**
- Board elections and voting
- Budget approvals and financial updates
- Policy resolutions (parking, pets, etc.)
- Board meeting schedules and outcomes

**Seasonal & Timely Information**
- Weather preparation (winter, summer)
- Holiday-related notices
- Seasonal facility closures (pool, etc.)
- Snow removal procedures

**Operational Updates**
- Landscaping and grounds maintenance
- Facility status (pool house, common areas)
- Parking enforcement and changes
- Management company updates

**Safety & Compliance**
- Fire safety reminders
- Emergency procedures
- Pet policy enforcement
- Unit owner responsibilities

**Community Events**
- Scheduled gatherings or activities
- Document shredding events
- Census or survey reminders
- Volunteer opportunities

### What to Include
- Concrete updates with status or next steps
- Action items for residents (deadlines, requirements)
- Changes to policies or procedures
- Upcoming events or important dates
- Reminders about ongoing responsibilities

### What to Exclude
- Routine administrative correspondence
- Individual unit issues
- Confidential legal matters
- Personal disputes or complaints

## Bulletin Structure

### Header Section (Masthead Design)
The header uses a professional masthead design with integrated branding:
- **Colored banner background** (gradient using primary color #1a5276)
- **Logo on the left** - small, embedded inline with white background padding
- **Title and subtitles on the right** in white text:
  - Main title with seasonal emoji: "❄️ Wharfside Manor Community Bulletin"
  - Month/Year and Association name on one line
  - Tagline: "Keeping residents informed and connected throughout the season"
  - Version indicator (e.g., "Draft v0.1")

### Community Message (Opening)
Always include:
- Warm greeting appropriate to the season
- Brief context-setting for the month
- Emergency contact information:
  - 9-1-1 for fire, medical, police emergencies
  - East Coast – Ideal Property Management (ECI): 732-970-6886
  - Alexander Plumbing: 732-422-2424 for urgent heating/plumbing
  - ECI Work Order System for non-emergency issues

### Content Sections
Organize mined content into logical sections with emoji headers:
- Use descriptive section titles
- Add relevant emoji icons to each header
- Present information clearly with action items when applicable
- Include dates, deadlines, and contact information where relevant

Common section patterns (adapt as needed):
- Project updates
- Budget and financial matters
- Elections and governance
- Parking and vehicles
- Seasonal reminders
- Safety notices
- Community events
- Policy reminders

### Closing Message
- Warm wishes appropriate to the season/upcoming holidays
- Thank residents for cooperation and engagement
- Sign from "Wharfside Manor Board of Trustees" or "Board of Trustees and Management"

## Tone and Style Guidelines

**Voice:**
- Friendly and approachable, but professional
- Informative without being bureaucratic
- Respectful and inclusive of all residents
- Community-focused and neighborly

**Style:**
- Clear and direct communication
- Action-oriented when appropriate
- Use emoji strategically for visual organization
- Break information into digestible sections
- Highlight key dates, deadlines, and requirements

**Formatting:**
- Use HTML heading tags for section headers
- Bold important items like dates, phone numbers, requirements
- Use bullet points for lists and multi-step information
- Maintain consistent spacing and visual hierarchy
- Use horizontal rules to separate major sections

## Reference Materials

Study the example bulletins in the `examples/` folder to understand:
- Seasonal emoji usage and themes
- Section organization and flow
- Level of detail for different topics
- Tone and phrasing patterns
- How to present ongoing vs. new topics
- Appropriate closing messages for different times of year

The examples represent the target quality and style - use them as your guide for structure, tone, and content decisions.

## Special Considerations

**Seasonal Awareness:**
- Tailor opening and closing messages to the time of year
- Include relevant seasonal reminders (winter prep, summer pool opening, etc.)
- Use appropriate holiday greetings (inclusive of all celebrations)
- Adjust emoji themes to match the season

**Ongoing vs. New Topics:**
- Ongoing projects: Provide status updates, note if "no change" since last month
- New topics: Provide full context and background
- Completed items: Acknowledge completion and thank participants

**Resident Actions:**
- Always be clear about what residents need to do and by when
- Distinguish between required actions and recommendations
- Provide contact information for questions or issues

**Inclusive Language:**
- Use welcoming, community-oriented language
- Acknowledge diverse celebrations and observances
- Avoid jargon when possible; explain technical terms when necessary

## Output Requirements

**Email Format:**
- Send as HTML email using Gmail MCP
- Use `mimeType: "text/html"` for rich formatting
- Include version in subject line: "[Month Year] Monthly Bulletin - Draft v0.X"
- Send to: nickd@wharfsidemb.com

**Logo Embedding (Base64):**
Gmail strips external URLs and large base64 images. Use this approach:
- Convert logo to JPEG, resize to ~150x100 pixels
- Compress with quality 75, optimize=true
- Base64 string must be under ~3000 characters to display inline
- Embed using data URI: `src="data:image/jpeg;base64,{base64_string}"`
- Logo file location: `/Users/nickd/Workspaces/ClaudeAgents/Wharfside_Logo.png`
- In masthead, display at 80px width with white background padding

**HTML Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6; }
    .masthead { background: linear-gradient(135deg, #1a5276 0%, #2874a6 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
    .title { font-size: 22px; font-weight: bold; margin: 0 0 5px 0; }
    .subtitle { font-size: 13px; opacity: 0.9; margin: 3px 0; }
    .version { font-size: 11px; opacity: 0.7; font-style: italic; margin-top: 8px; }
    .section { margin: 25px 0; }
    .section-header { font-size: 18px; color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 5px; margin-bottom: 15px; }
    .emergency-box { background: #fef9e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; }
    .highlight { background: #eaf2f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a5276; color: #666; }
    hr { border: none; border-top: 1px solid #ddd; margin: 30px 0; }
    strong { color: #1a5276; }
  </style>
</head>
<body>
  <div class="masthead">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td width="90" valign="middle">
          <img src="data:image/jpeg;base64,{logo_base64}" alt="Wharfside Manor" style="width:80px;height:auto;border-radius:4px;background:white;padding:5px;">
        </td>
        <td valign="middle" style="padding-left:15px;">
          <div class="title">{seasonal_emoji} Wharfside Manor Community Bulletin</div>
          <div class="subtitle">{month} {year} | Wharfside Manor Condominium Association, Inc.</div>
          <div class="subtitle">Keeping residents informed and connected throughout the season</div>
          <div class="version">Draft v{version}</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Content sections go here -->

  <div class="footer">
    <p><strong>Warmly,</strong></p>
    <p><strong>Wharfside Manor Board of Trustees</strong></p>
  </div>
</body>
</html>
```

**Initial Draft Expectations:**
- This first draft will be reviewed via email reply
- Focus on completeness and organization over perfection
- When uncertain about including something, include it for discussion
- Highlight any items that need clarification or additional context

## Review and Iteration

**Email-Based Collaboration:**
- Initial draft sent as HTML email to Nick
- Nick replies with feedback and requested changes
- Agent processes feedback and sends updated version
- Version number increments with each revision (v0.1 → v0.2 → v0.3)
- Subject line always includes current version

**Iteration Process:**
1. Receive feedback via email reply
2. Parse requested changes
3. Update bulletin content
4. Increment version number
5. Send new HTML email with updated bulletin
6. Repeat until approved for board review

**Publishing for Board Review:**
- When Nick approves, update subject to indicate "For Board Review"
- Final version ready for distribution to board members
- Nick handles forwarding to board distribution list

**Version Tracking:**
- Draft versions: v0.1, v0.2, v0.3, etc.
- Published for review: same version, status change in subject
- Final release: v1.0

The goal is to produce a bulletin that is informative, well-organized, and maintains the welcoming community tone that residents have come to expect.
