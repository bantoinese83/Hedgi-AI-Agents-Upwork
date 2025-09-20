# Contributing to Hedgi AI Agents

Thank you for your interest in contributing to Hedgi AI Agents! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **OpenAI API Key**: Required for testing AI functionality
- **Git**: For version control

### Development Setup

1. **Fork and Clone**:

   ```bash
   git clone https://github.com/yourusername/hedgi-ai-agents.git
   cd hedgi-ai-agents
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:

   ```bash
   # Using direnv (recommended)
   direnv allow

   # Or manually
   cp env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
hedgi-ai-agents/
├── apps/web/                    # Next.js web application
├── packages/ai/                 # Shared AI utilities and schemas
├── scripts/                     # Development and testing utilities
├── tools/                       # Postman collections and tools
├── docs/                        # Documentation
└── tests/                       # Test files
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run API tests
npm run test:api
```

### Test Structure

- **Unit Tests**: Located in `packages/ai/src/__tests__/`
- **API Tests**: Located in `apps/web/app/api/__tests__/`
- **Integration Tests**: Use the test scripts in `scripts/test/`

### Writing Tests

1. **Follow Jest Best Practices**:
   - Keep mocks simple and focused
   - Use `jest.fn()` for mock functions
   - Clear mocks between tests
   - Mock external dependencies

2. **API Testing**:
   - Test both success and error cases
   - Verify response structure
   - Test rate limiting
   - Mock OpenAI calls to avoid costs

3. **Example Test Structure**:

   ```typescript
   describe('API Endpoint', () => {
     beforeEach(() => {
       jest.clearAllMocks();
       // Setup test data
     });

     it('should handle valid requests', async () => {
       // Test implementation
     });

     it('should handle error cases', async () => {
       // Error test implementation
     });
   });
   ```

## 🔧 Development Guidelines

### Code Style

- **TypeScript**: Use strict mode and proper typing
- **ESLint**: Follow the configured rules
- **Prettier**: Use for code formatting
- **Naming**: Use descriptive names for variables and functions

### Code Quality

```bash
# Check code quality
npm run quality

# Fix code quality issues
npm run quality:fix

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Git Workflow

1. **Create a Feature Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**:
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit Changes**:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

## 🤖 AI Agent Development

### Adding New Agents

1. **Create Schema**: Add input/output schemas in `packages/ai/src/schemas.ts`
2. **Create Route**: Add API route in `apps/web/app/api/ai/your-agent/`
3. **Add Tests**: Create comprehensive tests
4. **Update Documentation**: Update README and API docs
5. **Add to Postman**: Update Postman collection

### Agent Structure

```typescript
// 1. Define schemas
export const YourAgentInputSchema = z.object({
  // Input validation
});

export const YourAgentResponseSchema = HedgiResponseSchema.extend({
  data: z.object({
    // Response structure
  }),
});

// 2. Create API route
export async function POST(request: NextRequest) {
  // Implementation
}
```

### Best Practices

- **Error Handling**: Always handle errors gracefully
- **Rate Limiting**: Use the built-in rate limiter
- **Logging**: Use the logger for debugging
- **Performance**: Monitor performance with the performance monitor
- **Cost Tracking**: Enable cost logging for OpenAI calls

## 📚 Documentation

### Updating Documentation

- **README.md**: Main project documentation
- **docs/README.md**: API documentation
- **ENVIRONMENT.md**: Environment setup guide
- **CONTRIBUTING.md**: This file

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Use proper markdown formatting

## 🐛 Bug Reports

### Reporting Bugs

1. **Check Existing Issues**: Search for similar issues
2. **Create New Issue**: Use the bug report template
3. **Provide Details**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details
   - Error messages/logs

### Bug Report Template

```markdown
## Bug Description

Brief description of the bug

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 18.17.0]
- npm version: [e.g., 9.6.7]

## Additional Context

Any other relevant information
```

## 💡 Feature Requests

### Suggesting Features

1. **Check Existing Issues**: Look for similar requests
2. **Create Feature Request**: Use the feature request template
3. **Provide Context**:
   - Use case description
   - Expected benefits
   - Implementation ideas (if any)

## 🔒 Security

### Security Issues

- **DO NOT** create public issues for security vulnerabilities
- **DO** email security issues to: security@hedgi.com
- **DO** include detailed information about the vulnerability

### Security Best Practices

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Follow secure coding practices
- Keep dependencies updated

## 📞 Getting Help

### Community Support

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and discussions
- **Documentation**: Check the docs/ directory

### Development Questions

- Check existing documentation
- Search closed issues for solutions
- Create a new issue with the "question" label

## 🎉 Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation

## 📄 License

By contributing to Hedgi AI Agents, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Hedgi AI Agents! 🚀
