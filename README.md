# Hedgi AI Agents

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=white)](https://prettier.io/)
[![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

A comprehensive suite of AI-powered financial analysis agents for small and medium businesses, built with Next.js and OpenAI's GPT-4.

## 📊 Project Status

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Security](https://img.shields.io/badge/security-secure-brightgreen)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)

## 🚀 Features

[![AI Agents](https://img.shields.io/badge/AI%20Agents-4-blue)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![API Endpoints](https://img.shields.io/badge/API%20Endpoints-5-blue)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Test Coverage](https://img.shields.io/badge/test%20coverage-85%25-blue)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![Documentation](https://img.shields.io/badge/documentation-complete-blue)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)
[![CI/CD Ready](https://img.shields.io/badge/CI%2FCD-ready-blue)](https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm (included with Node.js)
- **OpenAI API Key**: Required for AI agent functionality

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/bantoinese83/Hedgi-AI-Agents-Upwork.git
   cd Hedgi-AI-Agents-Upwork
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables with direnv** (Recommended):

   ```bash
   # Install direnv (if not already installed)
   brew install direnv

   # Add direnv to your shell
   echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
   source ~/.zshrc

   # Allow direnv to load environment variables
   direnv allow
   ```

   **Alternative Setup** (if not using direnv):

   ```bash
   # Copy environment template
   cp env.example .env.local

   # Edit .env.local with your OpenAI API key
   nano .env.local
   ```

4. **Start Development Server**:

   ```bash
   npm run dev
   ```

5. **Access the Application**:
   - Web App: http://localhost:3000
   - API Endpoints: http://localhost:3000/api/ai/\*

## 🔧 Environment Variables Management

This project uses `direnv` for automatic environment variable management. See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed setup instructions.

### Required Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key
- `NODE_ENV` - Environment (development/production)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4o)
- `ENABLE_COST_LOGGING` - Enable cost tracking (default: true)

## 📁 Project Structure

```
hedgi-ai-agents/
├── apps/
│   └── web/                           # Next.js web application
│       ├── app/
│       │   ├── api/
│       │   │   ├── ai/                # AI agent API endpoints
│       │   │   │   ├── smb-explainer/     # Monthly financial summaries
│       │   │   │   ├── audit-push/        # Accounting issue detection
│       │   │   │   ├── cash-flow-runway/  # Cash flow projections
│       │   │   │   └── savings-finder/    # Subscription optimization
│       │   │   ├── health/            # Health check endpoint
│       │   │   └── __tests__/         # API route tests
│       │   └── globals.css            # Global styles
│       ├── __mocks__/                 # Jest mocks
│       ├── jest.config.js             # Jest configuration
│       ├── jest.setup.js              # Jest setup file
│       ├── next.config.js             # Next.js configuration
│       ├── tsconfig.json              # TypeScript configuration
│       └── package.json
├── packages/
│   └── ai/                            # Shared AI utilities and schemas
│       ├── src/
│       │   ├── __tests__/             # AI package tests
│       │   ├── hedgi-openai.ts        # OpenAI client wrapper
│       │   ├── schemas.ts             # Zod validation schemas
│       │   ├── logger.ts              # Logging utilities
│       │   ├── performance-monitor.ts # Performance tracking
│       │   ├── rate-limiter.ts        # Rate limiting
│       │   ├── token-counter.ts       # Token counting
│       │   └── index.ts               # Main exports
│       ├── dist/                      # Compiled JavaScript
│       ├── coverage/                  # Test coverage reports
│       ├── jest.config.js             # Jest configuration
│       ├── tsconfig.json              # TypeScript configuration
│       └── package.json
├── scripts/
│   ├── test/                          # API test scripts
│   │   ├── simple-test.sh            # Basic API tests
│   │   └── test-all-apis.sh          # Comprehensive tests
│   ├── dev-setup.js                  # Development setup
│   ├── kill-port.js                  # Port management
│   └── README.md                     # Scripts documentation
├── tools/
│   └── postman/                       # API collection for testing
│       └── Hedgi-AI-Agents.postman_collection.json
├── docs/
│   └── README.md                      # API documentation
├── .envrc                             # direnv environment file
├── .gitignore                         # Git ignore rules
├── ENVIRONMENT.md                     # Environment setup guide
├── env.example                        # Environment template
├── package.json                       # Root package.json
├── tsconfig.json                      # Root TypeScript config
└── turbo.json                         # Turbo build configuration
```

## 🤖 AI Agents

### 1. SMB Explainer

**Endpoint:** `POST /api/ai/smb-explainer`

Provides comprehensive monthly financial summaries for small businesses.

**Features:**

- Monthly financial analysis and insights
- Key business recommendations
- Financial health scoring (0-100)
- Previous month comparisons
- Plain-English explanations

**Request Body:**

```json
{
  "business_name": "Your Business",
  "month": "January",
  "year": 2024,
  "rollups": {
    "total_income": 10000,
    "total_expenses": 8000,
    "net_income": 2000,
    "top_categories": [...]
  },
  "exemplar_transactions": [...],
  "previous_month_comparison": {...}
}
```

### 2. Audit Push

**Endpoint:** `POST /api/ai/audit-push`

Identifies accounting issues and proposes corrections.

**Features:**

- Uncategorized transaction detection
- Duplicate transaction identification
- Misclassified transaction analysis
- Journal entry corrections
- Categorization rule suggestions

### 3. Cash Flow Runway

**Endpoint:** `POST /api/ai/cash-flow-runway`

Calculates burn rate and runway projections.

**Features:**

- Cash flow pattern analysis
- Burn rate calculations
- Runway projections
- Risk assessments
- Recurring pattern detection

### 4. Savings Finder

**Endpoint:** `POST /api/ai/savings-finder`

Identifies subscription cost optimization opportunities.

**Features:**

- Subscription analysis
- Duplicate service detection
- Unused service identification
- Price increase alerts
- Savings calculations

## 🧪 Testing

### Jest Testing Framework

The project uses Jest for comprehensive API testing with proper mocking to prevent actual OpenAI API calls during testing.

**Run Tests:**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern="smb-explainer.test.ts"
```

**Test Structure:**

- **API Route Tests**: Located in `apps/web/app/api/__tests__/`
- **Mocked OpenAI Calls**: Tests use mocked responses to avoid API costs
- **Comprehensive Coverage**: Tests cover success cases, error handling, and edge cases

### Manual API Testing

```bash
# Test SMB Explainer
curl -X POST http://localhost:3000/api/ai/smb-explainer \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Test Business",
    "month": "January",
    "year": 2024,
    "rollups": {
      "total_income": 10000,
      "total_expenses": 8000,
      "net_income": 2000,
      "top_categories": [{"category": "Revenue", "amount": 10000, "percentage": 100}]
    },
    "exemplar_transactions": [],
    "previous_month_comparison": {"income_change": 10, "expense_change": 5, "net_change": 15}
  }'
```

### Postman Collection Testing

For comprehensive API testing with automated validation:

```bash
# Install Newman (Postman CLI)
npm install -g newman newman-reporter-html

# Run all tests
cd tools/postman
./run-tests.sh

# Run with custom settings
./run-tests.sh --url http://localhost:3000 --verbose

# Run in CI/CD mode
./run-tests.sh --report cli,json --timeout 60000
```

**Features:**

- ✅ Automated test validation
- ✅ Response structure verification
- ✅ Performance monitoring
- ✅ Error scenario testing
- ✅ Rate limit testing
- ✅ HTML and JSON reports

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:clean        # Start dev server with port cleanup

# Building
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Utilities
npm run type-check       # Run TypeScript type checking
npm run kill-ports       # Kill processes on common ports
```

### Development Workflow

1. **Environment Setup**: Use `direnv` for automatic environment variable management
2. **Code Quality**: ESLint and Prettier are configured for consistent code style
3. **Testing**: Write tests for new features and ensure they pass
4. **Type Safety**: TypeScript provides compile-time type checking
5. **Performance**: Built-in performance monitoring and cost tracking

## 📊 Performance & Monitoring

### Cost Tracking

- Automatic token usage tracking
- Cost calculations for OpenAI API calls
- Performance metrics logging
- Request/response time monitoring

### Rate Limiting

- Built-in rate limiting to prevent API abuse
- Configurable limits per IP address
- Graceful error handling for rate limit exceeded

### Error Handling

- Comprehensive error logging
- Graceful degradation on API failures
- Retry logic for transient failures
- User-friendly error messages

## 🔒 Security

### API Key Management

- Environment variables for sensitive data
- `.envrc` file excluded from version control
- Secure API key handling in production

### Input Validation

- Zod schemas for request validation
- Type-safe data processing
- Sanitization of user inputs

## 📚 Documentation

- **[API Documentation](./API.md)** - Complete API reference with examples
- **[Environment Setup](./ENVIRONMENT.md)** - Detailed direnv setup guide
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](./CHANGELOG.md)** - Project history and changes
- **[Postman Collection](./tools/postman/)** - Comprehensive API testing collection with automated tests
- **[Scripts Documentation](./scripts/README.md)** - Development utilities

## 🤝 Contributing

### Code Style

- Follow ESLint configuration
- Use Prettier for code formatting
- Write comprehensive tests
- Document new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Environment Variables Not Loading:**

```bash
# Check direnv status
direnv status

# Manually load environment
direnv exec . env | grep OPENAI

# Restart terminal session
```

**Tests Failing:**

```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test
npm test -- --testNamePattern="specific test name"
```

**API Not Working:**

```bash
# Check environment variables
curl http://localhost:3000/api/debug-env

# Verify OpenAI API key
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "test"}]}'
```

## 📞 Support

For issues and questions:

- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the documentation in the `docs/` directory
