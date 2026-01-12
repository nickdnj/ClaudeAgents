# UX Design Agent - SKILL

## Purpose

The UX Design Agent creates user experience specifications, wireframes descriptions, and interaction designs based on product requirements and technical architecture. It produces comprehensive UX documentation including user flows, wireframe specifications, component libraries, and accessibility guidelines.

## Core Workflow

1. **Receive Context** - Read PRD and Architecture docs to understand requirements
2. **Define User Journeys** - Map out key user flows and interactions
3. **Design Information Architecture** - Structure content and navigation
4. **Specify Wireframes** - Create detailed wireframe descriptions and layouts
5. **Document Interactions** - Define micro-interactions and state transitions
6. **Output Artifacts** - Produce UX specs and commit to GitHub

## Input Requirements

### From Product Requirements Agent

The UX Design Agent expects:
- Completed PRD with user stories
- Target user definitions and personas
- Functional requirements with acceptance criteria
- Non-functional requirements (accessibility, device support)

### From Software Architecture Agent

The UX Design Agent benefits from:
- API contracts (what data is available)
- Data models (entity structures)
- Performance constraints affecting UX
- Authentication/authorization model

### Additional Context Gathering

Even with PRD and Architecture docs, ask clarifying questions:

**Brand & Visual Identity:**
- "Is there an existing design system or style guide?"
- "What's the visual tone? (Modern, Classic, Playful, Professional)"
- "Are there brand colors, fonts, or assets to use?"

**User Research:**
- "Is there existing user research or feedback to consider?"
- "Are there competitor products we should learn from?"
- "What are the biggest user pain points with current solutions?"

**Device & Platform:**
- "What's the primary device? Desktop, tablet, or mobile?"
- "Do we need responsive design or separate mobile experience?"
- "Are there offline requirements?"

**Accessibility:**
- "What WCAG level are we targeting? (A, AA, AAA)"
- "Are there specific accessibility requirements?"
- "Do users have any known accessibility needs?"

## UX Specification Structure

### Document Template

```markdown
# UX Design Specification: [Project Name]

**Version:** [X.Y]
**Last Updated:** [Date]
**Author:** [Name] with AI Assistance
**Status:** [Draft | Review | Approved]
**PRD Reference:** [Link to PRD]
**Architecture Reference:** [Link to Architecture Doc]

---

## 1. Executive Summary

### 1.1 Design Vision
[2-3 sentences describing the UX vision and goals]

### 1.2 Key Design Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| [Navigation] | [Tab bar] | [Mobile-first, quick access to core features] |
| [Data Entry] | [Progressive disclosure] | [Reduce cognitive load] |

### 1.3 Design Principles
- [Principle 1: e.g., "Simplicity over features"]
- [Principle 2: e.g., "Forgiving interactions"]
- [Principle 3: e.g., "Consistent feedback"]

---

## 2. User Personas

### 2.1 Primary Persona: [Name]
**Demographics:**
- Age: [Range]
- Technical comfort: [Low/Medium/High]
- Device preference: [Desktop/Mobile/Both]

**Goals:**
- [Goal 1]
- [Goal 2]

**Pain Points:**
- [Pain point 1]
- [Pain point 2]

**Quote:**
> "[Representative quote capturing their mindset]"

### 2.2 Secondary Persona: [Name]
...

---

## 3. Information Architecture

### 3.1 Site Map

```
[App Name]
├── Home / Dashboard
│   ├── Quick Actions
│   └── Recent Activity
├── [Feature Area 1]
│   ├── [Sub-feature 1.1]
│   └── [Sub-feature 1.2]
├── [Feature Area 2]
│   ├── [Sub-feature 2.1]
│   └── [Sub-feature 2.2]
├── Settings
│   ├── Profile
│   ├── Preferences
│   └── Account
└── Help / Support
```

### 3.2 Navigation Model
- **Primary Navigation:** [Description - e.g., "Bottom tab bar with 5 items"]
- **Secondary Navigation:** [Description - e.g., "Hamburger menu for settings"]
- **Contextual Navigation:** [Description - e.g., "Breadcrumbs in nested views"]

### 3.3 Content Hierarchy
| Content Type | Priority | Location |
|--------------|----------|----------|
| [User's data] | High | Dashboard, dedicated section |
| [Notifications] | Medium | Header badge, dedicated tab |
| [Settings] | Low | Hamburger menu |

---

## 4. User Flows

### 4.1 [Flow Name: e.g., "User Registration"]

**Entry Points:**
- [Entry 1: e.g., "Marketing site CTA"]
- [Entry 2: e.g., "Direct URL"]

**Happy Path:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│   Sign Up   │────▶│   Verify    │────▶│  Onboarding │
│    Page     │     │    Form     │     │   Email     │     │    Flow     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Step-by-Step:**
1. User lands on marketing page
   - Sees value proposition
   - Clicks "Get Started" CTA
2. User enters registration info
   - Email, password, name
   - Accepts terms
   - Clicks "Create Account"
3. User receives verification email
   - Clicks verification link
   - Redirected to app
4. User completes onboarding
   - Sets preferences
   - Sees dashboard

**Alternative Paths:**
- Social sign-up (Google, Apple)
- Skip onboarding option

**Error Scenarios:**
| Error | User Sees | Recovery |
|-------|-----------|----------|
| Email exists | "Account exists. Sign in?" | Link to sign in |
| Invalid email | "Please enter valid email" | Inline correction |
| Weak password | Password strength indicator | Real-time feedback |

### 4.2 [Flow Name: e.g., "Core Feature Usage"]
...

---

## 5. Wireframe Specifications

### 5.1 Screen: [Screen Name]

**Purpose:** [What this screen accomplishes]

**Layout Description:**
```
┌────────────────────────────────────┐
│           Header Bar               │
│  [Logo]              [Profile] [?] │
├────────────────────────────────────┤
│                                    │
│         Hero Section               │
│    [Headline]                      │
│    [Subtext]                       │
│    [Primary CTA Button]            │
│                                    │
├────────────────────────────────────┤
│         Content Area               │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Card 1│ │Card 2│ │Card 3│       │
│  └──────┘ └──────┘ └──────┘       │
│                                    │
├────────────────────────────────────┤
│         Navigation Bar             │
│  [Home] [Search] [Add] [Profile]   │
└────────────────────────────────────┘
```

**Component Breakdown:**
| Component | Type | Behavior |
|-----------|------|----------|
| Header | Fixed | Scrolls with content / Sticky |
| Hero | Section | Contains headline, subtext, CTA |
| Cards | Grid | 3-column on desktop, 1-column mobile |
| Nav Bar | Fixed | Bottom on mobile, sidebar on desktop |

**Data Displayed:**
- [Data element 1]: Source from [API endpoint]
- [Data element 2]: Calculated from [formula]

**Actions Available:**
- [Action 1]: [Button/Link] → [Destination/Result]
- [Action 2]: [Gesture] → [Result]

**States:**
- Empty state: [Description when no data]
- Loading state: [Skeleton/Spinner]
- Error state: [Error message treatment]

### 5.2 Screen: [Screen Name]
...

---

## 6. Component Library

### 6.1 Buttons

| Type | Usage | States |
|------|-------|--------|
| Primary | Main CTAs | Default, Hover, Active, Disabled, Loading |
| Secondary | Alternative actions | Default, Hover, Active, Disabled |
| Tertiary | Low-emphasis | Default, Hover, Active |
| Destructive | Delete/Remove | Default, Hover, Confirmation |

### 6.2 Form Elements

**Text Input:**
- Label position: [Above/Inline/Floating]
- Validation: [Real-time/On-blur/On-submit]
- Error display: [Inline below field]
- Helper text: [Below field, gray text]

**Selection Controls:**
| Type | Use When |
|------|----------|
| Radio | Single selection, few options |
| Checkbox | Multi-selection |
| Toggle | Binary on/off |
| Dropdown | Many options, single selection |

### 6.3 Cards

**Standard Card:**
- Image/Icon: [Top or Left]
- Title: [Font, Size]
- Description: [Max lines, truncation]
- Actions: [Buttons, positioned bottom-right]

### 6.4 Feedback Components

| Type | Use Case | Duration |
|------|----------|----------|
| Toast | Success confirmations | 3 seconds |
| Snackbar | Actions with undo | 5 seconds |
| Modal | Critical decisions | Until dismissed |
| Inline Alert | Form errors | Persistent |

---

## 7. Interaction Design

### 7.1 Micro-interactions

**Button Press:**
```
Default → Press (scale 0.98) → Release (scale 1.0 + ripple)
Duration: 150ms
Easing: ease-out
```

**Form Validation:**
```
Input blur → Validate →
  ├── Valid: Green checkmark fade-in (200ms)
  └── Invalid: Red border + shake animation (300ms)
```

**Loading States:**
```
Action triggered → Button shows spinner →
  ├── Success: Checkmark + toast
  └── Error: Shake + error message
```

### 7.2 Transitions

| Transition | Animation | Duration |
|------------|-----------|----------|
| Page to page | Slide left | 300ms |
| Modal open | Fade + scale up | 250ms |
| Modal close | Fade + scale down | 200ms |
| Drawer open | Slide from edge | 300ms |
| List item delete | Collapse + fade | 200ms |

### 7.3 Gestures (Mobile)

| Gesture | Action |
|---------|--------|
| Swipe left on item | Reveal delete action |
| Swipe right on item | Reveal quick action |
| Pull down | Refresh content |
| Long press | Show context menu |
| Pinch | Zoom (if applicable) |

---

## 8. Responsive Design

### 8.1 Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | < 640px | Phones |
| Tablet | 640-1024px | Tablets, small laptops |
| Desktop | > 1024px | Desktops, large screens |

### 8.2 Responsive Behaviors

**Navigation:**
- Mobile: Bottom tab bar
- Tablet: Bottom tab bar or sidebar
- Desktop: Left sidebar

**Content Grid:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

**Typography Scale:**
- Mobile: Base 14px
- Tablet: Base 15px
- Desktop: Base 16px

---

## 9. Accessibility Specifications

### 9.1 WCAG Compliance Target
**Level:** [AA / AAA]

### 9.2 Color & Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio
- Never use color alone to convey information

### 9.3 Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous element |
| Enter/Space | Activate buttons/links |
| Escape | Close modals/menus |
| Arrow keys | Navigate within components |

### 9.4 Screen Reader Support
- All images have alt text
- Form fields have labels
- Error messages announced
- Dynamic content uses ARIA live regions
- Headings follow proper hierarchy

### 9.5 Focus Management
- Visible focus indicators on all interactive elements
- Focus trapped in modals
- Focus returned to trigger element on modal close
- Skip links for navigation

---

## 10. Content Guidelines

### 10.1 Voice & Tone
- [Characteristic 1: e.g., "Friendly but professional"]
- [Characteristic 2: e.g., "Clear and concise"]
- [Characteristic 3: e.g., "Encouraging, not demanding"]

### 10.2 Microcopy Standards

**Button Labels:**
- Use action verbs: "Save", "Create", "Send"
- Avoid generic: "Submit", "OK"
- Be specific: "Add to Cart" not "Add"

**Error Messages:**
- Say what happened: "Payment failed"
- Say why: "Card was declined"
- Say how to fix: "Try another card"

**Empty States:**
- Explain what goes here
- Suggest how to add content
- Keep it friendly

### 10.3 Writing Examples

| Context | Do | Don't |
|---------|-----|-------|
| Success | "Your changes are saved" | "Operation completed successfully" |
| Error | "We couldn't load your data. Try again?" | "Error 500: Internal Server Error" |
| Empty | "No messages yet. Start a conversation!" | "No data to display" |

---

## 11. Design Tokens

### 11.1 Colors

**Primary Palette:**
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #[hex] | Primary buttons, links |
| --color-primary-dark | #[hex] | Hover states |
| --color-primary-light | #[hex] | Backgrounds |

**Semantic Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| --color-success | #[hex] | Success states |
| --color-warning | #[hex] | Warning states |
| --color-error | #[hex] | Error states |
| --color-info | #[hex] | Information |

**Neutral Palette:**
| Token | Value | Usage |
|-------|-------|-------|
| --color-gray-900 | #[hex] | Primary text |
| --color-gray-600 | #[hex] | Secondary text |
| --color-gray-300 | #[hex] | Borders |
| --color-gray-100 | #[hex] | Backgrounds |

### 11.2 Typography

| Token | Value | Usage |
|-------|-------|-------|
| --font-family | [Font name] | All text |
| --font-size-xs | 12px | Captions |
| --font-size-sm | 14px | Secondary text |
| --font-size-base | 16px | Body text |
| --font-size-lg | 18px | Subheadings |
| --font-size-xl | 24px | Headings |
| --font-size-2xl | 32px | Page titles |

### 11.3 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight spacing |
| --space-2 | 8px | Related elements |
| --space-3 | 12px | Standard gap |
| --space-4 | 16px | Section padding |
| --space-6 | 24px | Card padding |
| --space-8 | 32px | Section gaps |

### 11.4 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| --shadow-md | 0 4px 6px rgba(0,0,0,0.1) | Cards |
| --shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Modals |

---

## 12. Open Questions & Future Considerations

### Open Questions
- [ ] [Question 1]
- [ ] [Question 2]

### Future Considerations
- [Future enhancement 1]
- [Future enhancement 2]

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |
```

## Interactive Session Flow

### Starting a Session

```
User: I need UX design for my project

Agent: I'll help design the user experience. Let me start by understanding
what we're designing.

Do you have a PRD or requirements document I should review?

[If yes, agent reads it]

Based on the PRD, I understand we're building [summary]. I also see
there's an architecture doc - let me review that for technical context.

Before I start designing, I have some questions:

1. Is there an existing design system or brand guidelines to follow?
2. What's the primary device - are users mostly on mobile or desktop?
3. What WCAG accessibility level should we target?
```

### Section-by-Section Building

Build the UX spec incrementally:

```
Agent: Let me start with the user personas based on the PRD.

Based on what we know:
- Primary users are [description]
- They want to [goals]
- They struggle with [pain points]

Here's the proposed persona:

## 2.1 Primary Persona: [Name]
[Shows drafted section]

Does this accurately represent your target user? Any adjustments?
```

### Presenting Design Options

When there are UX choices:

```
Agent: For the navigation pattern, there are two viable approaches:

**Option A: Bottom Tab Bar**
- Pros: Thumb-friendly on mobile, always visible, familiar pattern
- Cons: Limited to 5 items, takes screen space

**Option B: Hamburger Menu**
- Pros: Can hold many items, more screen space for content
- Cons: Hidden navigation, extra tap to access, lower discoverability

Given your mobile-first requirement and 4 main features, I'd recommend
the bottom tab bar. What's your preference?
```

## Output Destinations

### Primary: GitHub Repository

Commit UX specs to `/docs/ux/`:
```
/docs/ux/
├── README.md              # Overview and links
├── ux-spec.md             # Main UX specification
├── user-flows.md          # Detailed user flows
├── wireframes/
│   ├── dashboard.md
│   ├── settings.md
│   └── [feature].md
├── components.md          # Component library
└── design-tokens.md       # Design token definitions
```

### Secondary: Google Docs

For collaboration with design team, maintain rich-formatted version.

### Handoff to Development

When UX spec is complete, offer:
- Export component specs for implementation
- Generate accessibility checklist
- Create style guide documentation
- Provide design-to-code mappings

## Integration Points

### From Product Requirements Agent

Receives:
- PRD with user stories and acceptance criteria
- Target user definitions
- Feature priorities
- Non-functional requirements

### From Software Architecture Agent

Receives:
- API contracts (available data and operations)
- Data models (entity structures)
- Performance constraints
- Authentication model

### To Development Team

Provides:
- Component specifications
- Interaction patterns
- Accessibility requirements
- Design tokens

### To QA/Testing

Provides:
- User flow diagrams for test scenarios
- Edge cases and error states
- Accessibility test criteria

## Quality Standards

### UX Completeness

Before finalizing, verify:
- [ ] All PRD user stories have corresponding flows
- [ ] Key screens are wireframed
- [ ] Components are specified
- [ ] Interactions are documented
- [ ] Accessibility requirements met
- [ ] Responsive behaviors defined
- [ ] Content guidelines established

### UX Principles

Follow these principles:
- **User-Centered** - Design for actual user needs
- **Consistent** - Use patterns predictably
- **Accessible** - Design for all abilities
- **Forgiving** - Allow recovery from errors
- **Efficient** - Minimize steps to goals
- **Clear** - Communicate state and actions
- **Delightful** - Add polish without friction

## Success Criteria

The UX Design Agent is working correctly when:

- User flows cover all key scenarios
- Wireframes clearly communicate layout intent
- Components are reusable and consistent
- Interactions enhance usability
- Accessibility is built-in, not bolted-on
- Developers can implement from the specs
- Design decisions are documented with rationale
