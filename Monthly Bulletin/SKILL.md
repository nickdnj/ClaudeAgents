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

### Header Section (Nautical Masthead)
The header uses a nautical-themed masthead reflecting Wharfside Manor's Monmouth Beach location:
- **Wave pattern top border** (SVG wave in background color)
- **Navy blue gradient background** (#1a3a5c to #2c5f7c)
- **Centered logo** with gold border, white background padding, and shadow
- **Title "Wharfside Manor"** in large serif font (Georgia)
- **Anchor divider** (⚓ ⚓ ⚓)
- **"Community Bulletin" subtitle** in italic
- **Month badge** - gold pill-shaped badge with month/year
- **Location tagline** - "Monmouth Beach, New Jersey"
- **Wave pattern bottom** transitioning to white content area

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

**Logo Embedding (GitHub Hosted):**
The logo is served from GitHub for reliable display across all email clients:
- **Logo URL:** `https://raw.githubusercontent.com/nickdnj/ClaudeAgents/main/Wharfside_Logo.png`
- Display at 160px width in masthead
- Style with white background padding, gold border (#c9a227), rounded corners
- Add box shadow for depth
- Local file: `/Users/nickd/Workspaces/ClaudeAgents/Wharfside_Logo.png`

**HTML Template Structure (Nautical Theme):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Georgia', serif; max-width: 720px; margin: 0 auto; padding: 20px; color: #2c3e50; line-height: 1.7; background: linear-gradient(180deg, #e8f4f8 0%, #d4e6ec 100%); }
    .wrapper { background: white; border-radius: 0; box-shadow: 0 8px 30px rgba(0,0,0,0.15); overflow: hidden; border: 4px solid #1a3a5c; }

    /* Nautical Masthead */
    .masthead { background: linear-gradient(180deg, #1a3a5c 0%, #2c5f7c 100%); color: white; text-align: center; }
    .wave-top { height: 20px; /* SVG wave pattern */ }
    .logo { width: 160px; border-radius: 8px; background: white; padding: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 3px solid #c9a227; }
    .title { font-family: 'Georgia', serif; font-size: 32px; font-weight: bold; }
    .anchor-divider { font-size: 24px; margin: 10px 0; opacity: 0.7; } /* ⚓ ⚓ ⚓ */
    .month-badge { background: #c9a227; color: #1a3a5c; padding: 10px 30px; border-radius: 30px; font-size: 18px; font-weight: bold; }
    .wave-bottom { height: 40px; /* SVG wave pattern */ }

    /* Content */
    .content { padding: 25px 35px; }
    .section-header { font-size: 22px; color: #1a3a5c; padding: 12px 20px; background: linear-gradient(90deg, #e8f4f8 0%, white 100%); border-left: 5px solid #c9a227; border-radius: 0 8px 8px 0; }
    .welcome-box { background: linear-gradient(135deg, #f8f4e8 0%, #f0e8d8 100%); border: 2px solid #c9a227; border-radius: 12px; padding: 25px; }
    .emergency-box { background: linear-gradient(135deg, #fef9e7 0%, #fcf3cf 100%); border: 2px solid #e74c3c; border-radius: 12px; padding: 20px; }
    .highlight { background: linear-gradient(135deg, #e8f4f8 0%, #d5eef5 100%); border: 2px solid #5dade2; border-radius: 12px; padding: 20px; }
    .highlight-gold { background: linear-gradient(135deg, #fef9e7 0%, #fdebd0 100%); border: 2px solid #c9a227; border-radius: 12px; padding: 20px; }
    .pool-box { background: linear-gradient(135deg, #e8f8f5 0%, #d1f2eb 100%); border: 2px solid #1abc9c; border-radius: 12px; padding: 25px; text-align: center; }
    .divider { /* Rope wave pattern */ margin: 35px 0; }

    /* Footer */
    .footer { text-align: center; padding: 30px; background: linear-gradient(180deg, #1a3a5c 0%, #0d2137 100%); color: white; }
    .footer-anchor { font-size: 36px; } /* ⚓ */

    strong { color: #1a3a5c; }
    .gold { color: #c9a227; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="masthead">
      <div class="wave-top"></div>
      <img src="https://raw.githubusercontent.com/nickdnj/ClaudeAgents/main/Wharfside_Logo.png" alt="Wharfside Manor" class="logo">
      <div class="title">Wharfside Manor</div>
      <div class="anchor-divider">⚓ ⚓ ⚓</div>
      <div class="subtitle">Community Bulletin</div>
      <div class="month-badge">{month} {year}</div>
      <div class="tagline">Monmouth Beach, New Jersey</div>
      <div class="wave-bottom"></div>
    </div>

    <div class="content">
      <!-- Welcome box, emergency contacts, content sections -->
    </div>

    <div class="footer">
      <div class="footer-anchor">⚓</div>
      <p><strong>Warmly,</strong></p>
      <p><strong>Wharfside Manor Board of Trustees</strong></p>
      <p class="footer-tagline">Wharfside Manor Condominium Association, Inc. • Monmouth Beach, NJ</p>
    </div>
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
