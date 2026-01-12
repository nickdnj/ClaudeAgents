# Product Development Agent Suite - Vision Document

## Overview

A coordinated suite of specialized AI agents that collaborate to support the full product development lifecycle. Each agent is an expert in its domain and can work independently or hand off to other agents in defined workflows.

## The Vision

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     PRODUCT DEVELOPMENT AGENT SUITE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    DISCOVERY           DEFINITION          DESIGN           DELIVERY            │
│    ─────────           ──────────          ──────           ────────            │
│                                                                                  │
│    ┌─────────┐        ┌─────────┐        ┌─────────┐       ┌─────────┐         │
│    │ Market  │───────▶│ Product │───────▶│ UX      │──────▶│ Dev     │         │
│    │ Research│        │ Require-│        │ Design  │       │ Planning│         │
│    │ Agent   │        │ ments   │        │ Agent   │       │ Agent   │         │
│    └─────────┘        └─────────┘        └─────────┘       └─────────┘         │
│         │                  │                  │                 │               │
│         │                  │                  │                 │               │
│         │             ┌────┴────┐        ┌────┴────┐           │               │
│         │             │ Software│        │ Content │           │               │
│         │             │ Arch.   │        │ Strategy│           │               │
│         │             │ Agent   │        │ Agent   │           │               │
│         │             └─────────┘        └─────────┘           │               │
│         │                                                      │               │
│    ┌────┴────────────────────────────────────────────────────┴────┐           │
│    │                     SUPPORT AGENTS                            │           │
│    ├───────────────────────────────────────────────────────────────┤           │
│    │  Legal Agent  │  Security Agent  │  QA Strategy  │  Marketing │           │
│    └───────────────────────────────────────────────────────────────┘           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Agent Catalog

### Core Product Agents

| Agent | Purpose | Key Outputs | MCP Servers |
|-------|---------|-------------|-------------|
| **Product Requirements** | Gather and document product requirements | PRD (Google Doc) | google-docs, gdrive |
| **Software Architecture** | Design technical architecture | Architecture Doc, Diagrams | google-docs, gdrive, chrome |
| **UX Design** | User experience and interaction design | Wireframes, User Flows, Design Spec | google-docs, gdrive |
| **Dev Planning** | Break work into sprints and tasks | GitHub Issues, Task Breakdown | github, google-docs |

### Discovery Agents

| Agent | Purpose | Key Outputs | MCP Servers |
|-------|---------|-------------|-------------|
| **Market Research** | Analyze market, competitors, trends | Research Report | gmail, web-search, gdrive |
| **User Research** | Understand user needs and behaviors | User Personas, Interview Synthesis | gmail, google-docs |

### Support Agents

| Agent | Purpose | Key Outputs | MCP Servers |
|-------|---------|-------------|-------------|
| **Legal** | Review for compliance, contracts, IP | Risk Assessment, Contract Review | gmail, google-docs |
| **Security** | Security requirements and review | Security Spec, Threat Model | google-docs |
| **QA Strategy** | Define testing approach | Test Plan, QA Requirements | google-docs, github |
| **Marketing** | Positioning, messaging, go-to-market | Marketing Brief, Launch Plan | google-docs, gdrive |
| **Content Strategy** | Documentation, help content | Content Plan, Style Guide | google-docs |

### Operations Agents (Future)

| Agent | Purpose | Key Outputs | MCP Servers |
|-------|---------|-------------|-------------|
| **DevOps** | Infrastructure and deployment | Infrastructure Spec, CI/CD Config | github, terraform |
| **Analytics** | Metrics definition and tracking | Analytics Spec, Dashboard Designs | google-docs |
| **Support** | Customer support strategy | Support Playbook, FAQ | google-docs |

---

## Agent Workflows

### Standard Product Development Flow

```
┌──────────────┐
│   1. IDEA    │  User has a product idea
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. MARKET    │  Market Research Agent
│   RESEARCH   │  → Market Analysis Report
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. PRODUCT   │  Product Requirements Agent
│    REQS      │  ← Market Report
│              │  → PRD v1.0
└──────┬───────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ 4a. SOFTWARE │      │ 4b. UX       │
│ ARCHITECTURE │      │ DESIGN       │
│              │      │              │
│ ← PRD        │      │ ← PRD        │
│ → Arch Doc   │      │ → Design Spec│
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
       ┌──────────────┐
       │ 5. DEV       │  Dev Planning Agent
       │ PLANNING     │  ← PRD + Arch + Design
       │              │  → GitHub Issues
       └──────────────┘
```

### Parallel Agent Execution

Some agents can run concurrently:

```
PRD Complete
     │
     ├──────────────────────────────────────────────┐
     │                  │                           │
     ▼                  ▼                           ▼
┌─────────┐      ┌─────────┐                 ┌─────────┐
│ Arch    │      │ UX      │                 │ Security│
│ Agent   │      │ Agent   │                 │ Agent   │
└────┬────┘      └────┬────┘                 └────┬────┘
     │                │                           │
     │                │                           │
     └────────┬───────┴───────────────────────────┘
              │
              ▼
        Consolidated Review
```

### Ad-Hoc Consultations

Any agent can be invoked directly for specific tasks:

```
User: "Review this vendor contract for risks"
→ Legal Agent (standalone)
→ Risk Assessment

User: "What testing approach for this API?"
→ QA Strategy Agent (standalone)
→ Test Plan
```

---

## Detailed Agent Specifications

### 1. Product Requirements Agent ✅ (Built)

**Status:** Complete

**Workflow:**
1. Vision & problem definition
2. Scope & constraints
3. Functional requirements
4. Non-functional requirements
5. Technical constraints
6. UX requirements overview

**Output:** PRD Google Doc

**Handoffs:**
- Receives: Market Research report (optional)
- Sends to: Architecture, UX, Legal, Security

---

### 2. Software Architecture Agent (To Build)

**Purpose:** Design the technical architecture for a software system based on product requirements.

**Key Questions to Ask:**
- What are the scalability requirements?
- What are the performance constraints?
- What integrations are needed?
- What's the deployment environment?
- What's the team's technical expertise?
- Are there existing systems to integrate with?

**Outputs:**
- System Architecture Document
- Component diagrams (using Mermaid or similar)
- API specifications
- Data model design
- Technology recommendations
- Infrastructure requirements

**Document Template:**
```markdown
# Software Architecture: [Project Name]

## 1. Architecture Overview
### System Context
[High-level system context diagram]

### Key Architectural Decisions
| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|

## 2. Component Architecture
### Component Diagram
[Mermaid diagram]

### Component Descriptions
[Each component with responsibilities]

## 3. Data Architecture
### Data Model
[Entity relationship diagram]

### Data Flow
[Data flow diagrams]

## 4. API Design
### API Overview
[REST/GraphQL/gRPC approach]

### Key Endpoints
[Endpoint specifications]

## 5. Infrastructure
### Deployment Architecture
[Infrastructure diagram]

### Scaling Strategy
[How system scales]

## 6. Security Architecture
### Security Model
[Authentication, authorization]

### Data Protection
[Encryption, privacy]

## 7. Technology Stack
### Recommended Technologies
| Layer | Technology | Rationale |
|-------|------------|-----------|

### Alternatives Considered
[Why alternatives were rejected]
```

**MCP Servers Needed:**
- google-docs (output)
- gdrive (storage)
- chrome (research existing architectures)

---

### 3. UX Design Agent (To Build)

**Purpose:** Define user experience, interaction design, and UI specifications.

**Key Questions to Ask:**
- Who are the primary users?
- What are the key user journeys?
- What's the platform (web, mobile, desktop)?
- Are there brand/design system constraints?
- What's the accessibility requirement?
- What's the user's technical sophistication?

**Outputs:**
- User Personas
- User Journey Maps
- Wireframes (described, can generate with tools)
- Interaction Specifications
- UI Component Requirements
- Accessibility Checklist

**Document Template:**
```markdown
# UX Design Specification: [Project Name]

## 1. User Research Summary
### User Personas
[Persona descriptions with goals, frustrations]

### User Journey Maps
[Key journeys with touchpoints, emotions]

## 2. Information Architecture
### Site/App Structure
[Navigation hierarchy]

### Content Organization
[How information is organized]

## 3. Interaction Design
### Key Flows
[Step-by-step interaction flows]

### States & Transitions
[UI states, loading, error, empty]

## 4. Wireframes
### [Screen 1]
[ASCII/description wireframe]
[Interaction notes]

### [Screen 2]
...

## 5. UI Specifications
### Component Library
[Required components with specs]

### Design Tokens
[Colors, typography, spacing if not using existing system]

## 6. Accessibility
### WCAG Level
[A, AA, or AAA]

### Key Considerations
[Specific accessibility requirements]

## 7. Responsive Design
### Breakpoints
[Device breakpoints]

### Adaptations
[How UI adapts per breakpoint]
```

**MCP Servers Needed:**
- google-docs (output)
- gdrive (storage)
- chrome (UI research, pattern libraries)

---

### 4. Dev Planning Agent (To Build)

**Purpose:** Convert requirements and designs into actionable development tasks.

**Key Questions to Ask:**
- What's the target timeline?
- What's the team size and composition?
- What's the sprint cadence?
- What's the priority order?
- What are the dependencies?
- What can be parallelized?

**Outputs:**
- Epic breakdown
- User story definitions
- Task decomposition
- Sprint planning suggestions
- Dependency mapping
- Risk identification

**Workflow:**
1. Read PRD, Architecture, and UX docs
2. Identify epics (major feature areas)
3. Break epics into user stories
4. Decompose stories into tasks
5. Estimate complexity (relative sizing)
6. Identify dependencies and critical path
7. Suggest sprint allocation

**Output Format:**
- GitHub issues (via github MCP)
- Task list Google Doc
- Sprint plan spreadsheet

**MCP Servers Needed:**
- google-docs (input/output)
- gdrive (storage)
- github (create issues)

---

### 5. Legal Agent (To Build)

**Purpose:** Review documents and products for legal risks, compliance, and contract issues.

**Capabilities:**
- Contract review (vendor agreements, partnerships)
- Privacy/GDPR compliance checking
- Terms of service drafting
- IP protection recommendations
- Risk assessment for features

**Key Questions:**
- What jurisdiction applies?
- What data is being collected/processed?
- Are there specific regulations (HIPAA, FINRA, etc.)?
- Is this B2B or B2C?
- What's the liability exposure?

**Outputs:**
- Risk Assessment Report
- Compliance Checklist
- Contract Redlines
- Policy Recommendations

**MCP Servers Needed:**
- google-docs (input/output)
- gdrive (contract storage)
- gmail (legal correspondence)

---

### 6. Security Agent (To Build)

**Purpose:** Define security requirements and review architectures for security issues.

**Capabilities:**
- Threat modeling
- Security requirements definition
- Architecture security review
- Compliance mapping (SOC2, ISO27001)
- Penetration test scoping

**Outputs:**
- Security Requirements Document
- Threat Model
- Security Architecture Review
- Compliance Mapping
- Security Testing Plan

**MCP Servers Needed:**
- google-docs (input/output)
- gdrive (storage)

---

### 7. Marketing Agent (To Build)

**Purpose:** Develop product positioning, messaging, and go-to-market strategy.

**Capabilities:**
- Competitive positioning
- Messaging frameworks
- Launch planning
- Content strategy
- Channel strategy

**Key Questions:**
- Who's the target buyer?
- What's the competitive landscape?
- What's the pricing strategy?
- What channels reach the audience?
- What's the launch timeline?

**Outputs:**
- Positioning Document
- Messaging Framework
- Go-to-Market Plan
- Launch Checklist
- Content Calendar

**MCP Servers Needed:**
- google-docs (output)
- gdrive (storage)
- gmail (research competitor emails)

---

## Agent Communication Protocol

### Handoff Format

When one agent hands off to another, use this structure:

```json
{
  "from_agent": "product-requirements",
  "to_agent": "software-architecture",
  "handoff_type": "complete",
  "documents": [
    {
      "type": "PRD",
      "location": "google-doc",
      "id": "1abc123...",
      "version": "1.0"
    }
  ],
  "context": "PRD for orchestrator project is complete and approved.",
  "specific_requests": [
    "Focus on scalability for multi-user scenarios",
    "Consider cost optimization for cloud hosting"
  ],
  "constraints": [
    "Must use Python for backend",
    "Should work on single Mac Mini initially"
  ]
}
```

### Status Updates

Agents report status through a common format:

```json
{
  "agent": "software-architecture",
  "project": "orchestrator",
  "status": "in_progress",
  "completion": 60,
  "current_section": "Data Architecture",
  "blockers": [],
  "next_steps": [
    "Complete API design",
    "Define infrastructure requirements"
  ],
  "documents": [
    {
      "name": "Architecture Doc",
      "status": "draft",
      "version": "0.4"
    }
  ]
}
```

---

## GitHub as Project Backbone

All projects created with this agent suite are managed in GitHub repositories. GitHub serves as:

1. **Code Repository** - All source code lives in GitHub
2. **Project Management** - Issues, milestones, and project boards track work
3. **Documentation Home** - README, wikis, and markdown docs in repo
4. **Artifact Storage** - Design docs, architecture diagrams, specs checked in
5. **Collaboration Hub** - PRs, code review, discussions

### GitHub Integration Across Agents

| Agent | GitHub Usage |
|-------|--------------|
| **Product Requirements** | Creates repo README with project overview |
| **Software Architecture** | Commits architecture docs, ADRs to `/docs/architecture` |
| **UX Design** | Commits design specs, wireframes to `/docs/design` |
| **Dev Planning** | Creates GitHub issues, milestones, project board |
| **QA Strategy** | Creates test plan issues, links to test suites |
| **Security** | Creates security issues (private), threat models to `/docs/security` |

### Repository Structure

```
github.com/[org]/[project-name]/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── docs/
│   ├── architecture/
│   │   ├── README.md
│   │   ├── system-design.md
│   │   ├── data-model.md
│   │   └── decisions/
│   │       └── ADR-001-database.md
│   ├── design/
│   │   ├── README.md
│   │   ├── personas.md
│   │   ├── user-flows.md
│   │   └── wireframes/
│   ├── requirements/
│   │   └── PRD.md
│   └── security/
│       └── threat-model.md
├── src/
├── tests/
├── README.md (project overview, links to docs)
└── CONTRIBUTING.md
```

### Project Board Setup

Each project gets a GitHub Project board with columns:

| Column | Purpose |
|--------|---------|
| **Backlog** | All issues not yet scheduled |
| **Ready** | Defined, estimated, ready for sprint |
| **In Progress** | Currently being worked on |
| **Review** | PR open, awaiting review |
| **Done** | Completed and merged |

### GitHub MCP Server

The `github` MCP server enables agents to:
- Create repositories
- Create and manage issues
- Create milestones and project boards
- Read existing issues and PRs
- Commit documentation files

---

## Project Folder Structure (Local Working Copy)

For each software project, create a consistent structure:

```
/Projects/[project-name]/
├── 00-planning/
│   ├── market-research.md
│   └── project-brief.md
├── 01-requirements/
│   ├── PRD.gdoc → [Google Doc link]
│   └── PRD-v1.0.md (backup)
├── 02-architecture/
│   ├── architecture.gdoc → [Google Doc link]
│   ├── diagrams/
│   │   ├── system-context.mmd
│   │   ├── components.mmd
│   │   └── data-model.mmd
│   └── decisions/
│       └── ADR-001-database-choice.md
├── 03-ux-design/
│   ├── design-spec.gdoc → [Google Doc link]
│   ├── personas/
│   ├── journeys/
│   └── wireframes/
├── 04-development/
│   ├── sprint-plan.md
│   ├── task-breakdown.md
│   └── github-issues.md
├── 05-legal/
│   ├── risk-assessment.md
│   └── contracts/
├── 06-security/
│   ├── threat-model.md
│   └── security-requirements.md
├── 07-marketing/
│   ├── positioning.md
│   ├── messaging.md
│   └── launch-plan.md
└── README.md (project overview with links)
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Product Requirements Agent
- [ ] Software Architecture Agent
- [ ] UX Design Agent
- [ ] Orchestrator (to manage agents)

### Phase 2: Development Support
- [ ] Dev Planning Agent
- [ ] QA Strategy Agent
- [ ] Security Agent

### Phase 3: Business Support
- [ ] Legal Agent
- [ ] Marketing Agent
- [ ] Content Strategy Agent

### Phase 4: Operations
- [ ] DevOps Agent
- [ ] Analytics Agent
- [ ] Support Agent

---

## Using the Suite

### Starting a New Project

```
User: I want to start a new software project for [idea]

Orchestrator: Let's set up your project. I'll guide you through:

1. First, I'll start a Product Requirements session to define what you're building
2. Once the PRD is approved, we can run Architecture and UX in parallel
3. Then Dev Planning will create your initial task breakdown

Ready to start with requirements gathering?
```

### Jumping to a Specific Agent

```
User: I need to review security for my existing project

Orchestrator: I'll load the Security Agent.

Do you have existing documentation I should review?
- PRD: [Google Doc link]
- Architecture: [Google Doc link]

Security Agent: I've reviewed your documentation. Let me walk through a
threat model for the system as designed...
```

### Project Status Check

```
User: What's the status of the orchestrator project?

Orchestrator: Here's the current status:

📋 Product Requirements: Complete (v1.0)
🏗️ Architecture: In Progress (60%)
🎨 UX Design: Not Started
📝 Dev Planning: Waiting on Arch + UX
🔒 Security: Not Started
📣 Marketing: Not Started

The Architecture agent is currently working on the Data Architecture section.
Want me to check in on that, or would you like to start another workstream?
```

---

## Success Metrics

The Agent Suite is successful when:

1. **Time Savings**: Product documentation takes 50% less time than manual writing
2. **Completeness**: Documents cover all necessary aspects (fewer gaps found in review)
3. **Consistency**: All projects follow the same structure and quality standards
4. **Handoff Quality**: Next agent in chain has everything needed to proceed
5. **Scalability**: Adding new agents doesn't require changing existing ones
6. **User Satisfaction**: Building products feels streamlined, not bureaucratic

---

## Next Steps

1. **Build Software Architecture Agent** - Second most critical after Requirements
2. **Build UX Design Agent** - Enables parallel design workstream
3. **Build Orchestrator** - Coordinate multiple agents
4. **Pilot on Real Project** - Use suite for orchestrator development itself
5. **Iterate Based on Usage** - Refine agent handoffs and outputs
