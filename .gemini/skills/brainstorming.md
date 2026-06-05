---
name: brainstorming
description: MUST use this skill before any creative activity, feature design, component creation, behavior change, architecture decision, or significant code modification. Use when the user wants to explore an idea, refine requirements, compare approaches, design systems, or prepare an implementation plan before writing code.
---

# Brainstorming: From Idea to Technical Plan

This skill guides Gemini through a structured brainstorming and design process before implementation.

It is especially useful for the UniEvents project, where changes must be incremental, well-scoped, compatible with the existing Flask + PostgreSQL + React/Vite architecture, and validated before code modifications.

## Core Rule

Do not jump directly into implementation.

First understand the goal, inspect the current project state, clarify scope, compare approaches, and only then propose a concrete implementation plan.

## Process

### Step 1: Understand the idea

Before proposing a solution:

- Inspect the current project state using `list_directory` and `read_file` when relevant.
- Identify the files, modules, models, services, routes, components, or configuration files that may be affected.
- Restate the user's goal in clear technical terms.
- Identify what is known, what is unknown, and what needs clarification.
- Ask only one clarification question at a time if clarification is needed.
- When possible, offer multiple-choice options to make decisions easier for the user.

Focus on:

- Scope.
- Constraints.
- Existing architecture.
- Data model compatibility.
- User roles affected.
- Success criteria.
- Manual tests needed after implementation.

### Step 2: Explore possible approaches

Propose 2-3 implementation approaches.

For each approach, include:

- Description.
- Advantages.
- Disadvantages.
- Risk level.
- Files likely affected.
- Whether database migrations are needed.
- Whether backend/frontend/API changes are needed.
- Whether the approach is suitable for MVP.

Always highlight the recommended approach first and explain why it is the best fit.

Prefer:

- Small, incremental changes.
- No refactor unless necessary.
- No new dependency unless justified.
- No database migration unless clearly required.
- Reuse of existing services/components.
- Backward compatibility with existing data and flows.

### Step 3: Define the technical design

Once the approach is clear, present a technical design.

Cover:

1. **Architecture**
   - Backend/frontend/data flow.
   - Existing files/modules involved.
   - New files/modules, if any.

2. **Data model**
   - Existing fields reused.
   - New fields, if absolutely necessary.
   - Migration impact.
   - Seed/test data impact.

3. **Backend logic**
   - Routes.
   - Services.
   - Validation.
   - Security/role checks.
   - Error handling.

4. **Frontend logic**
   - Components/pages affected.
   - UI behavior.
   - Loading/error/empty states.
   - Role-based visibility.

5. **Testing**
   - Manual test checklist.
   - Role-based test cases.
   - Regression risks.

Keep sections clear and concise. If the design is large, split it into smaller sections and ask for confirmation after each major section.

### Step 4: Prepare implementation

Before modifying files:

- Summarize the final patch scope.
- List exact files to be changed.
- List exact files that must not be changed.
- Mention whether backend migrations are needed.
- Mention whether new dependencies are needed.
- Define expected behavior after the patch.
- Define rollback or safety considerations.

Ask the user for confirmation before applying changes.

## Documentation Output

If the user asks to save the brainstorming result as documentation, write the validated design to:

```text
docs/plans/YYYY-MM-DD-<topic>-design.md
```

Use `write_file` only after the user approves the final design.

Add this neutral footer to generated planning documents:

```markdown
---
Generated as part of the UniEvents AI-assisted development workflow.
```

## Implementation Preparation

After the design is approved, ask:

```text
Ești gata să pregătim implementarea?
```

If the user confirms, proceed with a minimal patch plan.

Use `run_shell_command` only when necessary and only for safe commands such as inspection, tests, linting, or clearly approved setup steps.

## Safety Rules

- Do not modify files during the brainstorming phase.
- Do not create migrations unless the design explicitly requires them.
- Do not modify unrelated UI or backend logic.
- Do not change authentication, roles, or data model behavior without explicit confirmation.
- Do not overwrite existing seed data or production-like data.
- Do not delete data.
- Do not introduce external services unless explicitly requested.
- Do not add new dependencies without explaining why they are needed.
- Do not claim a file or feature works until it has been tested or logically validated.

## Key Principles

- **One question at a time** — avoid overwhelming the user.
- **Ruthless YAGNI** — avoid unnecessary features and premature architecture.
- **Explore alternatives** — compare 2-3 approaches before selecting one.
- **Incremental validation** — validate each major decision before implementation.
- **Project compatibility first** — adapt solutions to the existing UniEvents architecture.
- **Role-aware design** — always consider guest, participant, organizer, and admin flows.
- **Data safety** — preserve existing database state and avoid destructive operations.
- **Demo readiness** — prioritize stable, explainable, testable behavior suitable for presentation.
