# Agents Instructions

## Language & Communication

- **Code and commits**: Write all code, comments, and commit messages in English
- **Application language**: The application UI and user-facing content should be in Polish
- **Documentation**: Keep technical documentation in English

## Development Workflow

- **Commits**: Create a commit after every major feature implementation
- **Ask for approval**: Always ask for approval before completing a task and committing the final code
- **Feel free to ask**: If unsure about any requirement or implementation detail, ask for clarification
- **Breaking changes**: Always ask before making changes that modify existing behavior
- **Testing during development**: Verify that everything is working while implementing features
- **Business logic tests**: Write tests for all business logic, put them in the `__tests__` folder next to the implementation files
- **End-to-end tests**: Write E2E tests for all user flows, put them in the `e2e` folder

## Code Style & Quality

- **UI Framework**: Follow the shadcn/ui style guide for all UI components
- **Formatting**: Code must be formatted with Prettier
- **Linting**: All code must pass ESLint checks without errors
- **Documentation**: Do not add useless docs and comments
- **File size**: Files should not be bigger than 200 lines
- **Testing**: Rememeber about unit/integration/E2E testing
- **Dependencies**: Don't add useless dependencies to the codebase
- **Delete old code**: If something is unused, just delete it
- **Don't use magic numbers/strings**: Use types or constants instead

## Best Practices

- Test incrementally as you build
- Maintain consistency with existing code patterns
- Prioritize user experience and accessibility
- Keep components modular and reusable
- Follow conventional commit message rules

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
