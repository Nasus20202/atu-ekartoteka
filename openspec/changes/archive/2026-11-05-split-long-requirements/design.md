# Design

## Context

OpenSpec flags a requirement description longer than 500 characters. For an existing requirement the rule is to keep its header and every scenario, shorten the description to one behaviour, and add each removed behaviour as a new requirement with scenarios. See proposal.md for the scope.

## Decisions

- **Stay in the same capability.** New requirements are added to the capability that owns the original, so no capability folder is created.
- **Move text, do not rewrite it.** Sentences are copied into the new requirement. The only edits are what a standalone requirement needs: a `SHALL` where the original was descriptive prose (`Blank End Date Means Current Owner`), and a subject where a sentence began with "A mismatch" or "These values".
- **Scenarios stay where they are.** Existing scenarios remain under the original requirement even when the behaviour they exercise moved, because MODIFIED must carry every scenario. Each new requirement gets its own new scenario so it is testable by itself.
- **Names describe the single behaviour** (for example `Cross-Year Mismatch Is a Warning`) and are unique within their capability.

## Risks / Trade-offs

- [A reader finds a scenario under a requirement that no longer states its behaviour] → the original requirement keeps its name and a cross-reference sentence is not needed because the behaviours are adjacent in the same spec.
