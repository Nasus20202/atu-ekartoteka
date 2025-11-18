# GitHub Copilot Instructions

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
- **Business logic tests**: Write tests for all business logic

## Code Style & Quality

- **UI Framework**: Follow the shadcn/ui style guide for all UI components
- **Formatting**: Code must be formatted with Prettier
- **Linting**: All code must pass ESLint checks without errors
- **Documentation**: Do not add useless docs and comments
- **File size**: Files should not be bigger than 200 lines
- **Testing**: Rememeber about unit/integration/E2E testing
- **Dependencies**: Don't add useless dependencies to the codebase
- **Delete old code**: If something is unused, just delete it

## Best Practices

- Test incrementally as you build
- Maintain consistency with existing code patterns
- Prioritize user experience and accessibility
- Keep components modular and reusable
