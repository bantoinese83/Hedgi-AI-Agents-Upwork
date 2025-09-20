# Hedgi AI Agents - Project Summary

## 🎯 Project Overview

Hedgi AI Agents is a comprehensive suite of AI-powered financial analysis tools designed specifically for small and medium businesses (SMBs). The platform provides intelligent insights, automated analysis, and actionable recommendations to help businesses optimize their financial operations.

## 🏗️ Architecture

### Monorepo Structure

- **`apps/web`**: Next.js 14 web application with API routes
- **`packages/ai`**: Shared AI utilities, schemas, and OpenAI integration
- **`scripts/`**: Development and testing utilities
- **`tools/`**: Postman collections and testing tools
- **`docs/`**: Comprehensive documentation

### Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 with JSON mode
- **Validation**: Zod schemas for type safety
- **Language**: TypeScript with strict mode
- **Package Manager**: npm workspaces
- **Testing**: Jest with comprehensive mocking
- **Linting**: ESLint + Prettier
- **Environment**: direnv for variable management

## 🤖 AI Agents

### 1. SMB Explainer

- **Purpose**: Monthly financial summaries and insights
- **Features**: Key insights, recommendations, financial health scoring
- **Endpoint**: `POST /api/ai/smb-explainer`

### 2. Audit Push

- **Purpose**: Accounting issue detection and correction
- **Features**: Duplicate detection, categorization rules, journal entries
- **Endpoint**: `POST /api/ai/audit-push`

### 3. Cash Flow Runway

- **Purpose**: Burn rate and runway analysis
- **Features**: Cash flow projections, risk assessment, recommendations
- **Endpoint**: `POST /api/ai/cash-flow-runway`

### 4. Savings Finder

- **Purpose**: Subscription cost optimization
- **Features**: Duplicate detection, usage analysis, savings calculations
- **Endpoint**: `POST /api/ai/savings-finder`

## 🔧 Key Features

### Performance & Monitoring

- **Cost Tracking**: Automatic token usage and cost monitoring
- **Rate Limiting**: Built-in protection against API abuse
- **Performance Monitoring**: Request timing and system health
- **Health Check**: System status and diagnostics

### Development Experience

- **TypeScript**: Full type safety across the project
- **Testing**: Comprehensive Jest test suite with mocking
- **Linting**: ESLint + Prettier for code quality
- **Environment Management**: direnv for automatic variable loading
- **Documentation**: Extensive documentation and examples

### Security & Reliability

- **Input Validation**: Zod schemas for all API inputs
- **Error Handling**: Comprehensive error management
- **Rate Limiting**: Protection against abuse
- **Environment Security**: Secure API key management

## 📁 Project Structure

```
hedgi-ai-agents/
├── apps/web/                    # Next.js web application
│   ├── app/api/ai/             # AI agent endpoints
│   ├── app/api/health/         # Health check endpoint
│   ├── app/api/__tests__/      # API tests
│   └── __mocks__/              # Jest mocks
├── packages/ai/                 # Shared AI utilities
│   ├── src/                    # Source code
│   ├── dist/                   # Compiled output
│   └── coverage/               # Test coverage
├── scripts/                    # Development utilities
│   └── test/                   # API test scripts
├── tools/                      # Postman collections
├── docs/                       # Documentation
└── Configuration files         # Various config files
```

## 🧪 Testing Strategy

### Test Types

- **Unit Tests**: Individual function testing
- **API Tests**: Endpoint integration testing
- **Mock Testing**: OpenAI API mocking to prevent costs
- **Coverage**: Comprehensive test coverage reporting

### Test Files

- **AI Package**: `packages/ai/src/__tests__/`
- **API Routes**: `apps/web/app/api/__tests__/`
- **Test Scripts**: `scripts/test/`

### Testing Commands

```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm run test:api           # Run API tests
./scripts/test/simple-test.sh    # Manual API testing
```

## 📚 Documentation

### Core Documentation

- **README.md**: Main project documentation
- **API.md**: Complete API reference
- **CONTRIBUTING.md**: Contribution guidelines
- **CHANGELOG.md**: Project history
- **ENVIRONMENT.md**: Environment setup guide

### Technical Documentation

- **Project Structure**: Detailed file organization
- **API Endpoints**: Complete endpoint documentation
- **Testing Guide**: Testing strategies and examples
- **Development Setup**: Step-by-step setup instructions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key
- direnv (recommended)

### Quick Start

```bash
# Clone and install
git clone <repository>
cd hedgi-ai-agents
npm install

# Set up environment
direnv allow  # or manually copy env.example to .env.local

# Start development
npm run dev
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run lint             # Run linting
npm run format           # Format code
npm run quality          # Run all quality checks
```

## 🔒 Security Considerations

### API Key Management

- Environment variables for sensitive data
- direnv for automatic variable loading
- .envrc excluded from version control

### Input Validation

- Zod schemas for all inputs
- Type-safe data processing
- Sanitization of user inputs

### Rate Limiting

- Built-in protection against abuse
- Configurable limits per IP
- Graceful error handling

## 📊 Performance Metrics

### Cost Tracking

- Automatic token usage monitoring
- Cost calculations for OpenAI calls
- Performance metrics logging

### Monitoring

- Request/response timing
- System health monitoring
- Error tracking and logging

## 🛠️ Development Workflow

### Code Quality

- TypeScript strict mode
- ESLint + Prettier configuration
- Comprehensive testing
- Code coverage reporting

### Git Workflow

- Feature branch development
- Conventional commit messages
- Pull request reviews
- Automated quality checks

## 📈 Future Enhancements

### Planned Features

- Additional AI agents
- Enhanced analytics
- User authentication
- Dashboard interface
- Real-time notifications

### Technical Improvements

- Performance optimizations
- Enhanced error handling
- Additional test coverage
- Documentation improvements

## 🤝 Contributing

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Contribution Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits
- Follow code style guidelines

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 📞 Support

For questions and support:

- Check the documentation
- Review existing issues
- Create a new issue
- Contact the development team

---

_This project represents a comprehensive, production-ready AI agent platform with robust testing, documentation, and development practices._
