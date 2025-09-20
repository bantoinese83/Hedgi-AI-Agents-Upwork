# Changelog

All notable changes to Hedgi AI Agents will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive documentation system
- direnv integration for environment management
- Jest testing framework with proper mocking
- Performance monitoring and cost tracking
- Rate limiting for API endpoints
- Health check endpoint
- Postman collection for API testing
- Automated test scripts
- TypeScript configuration across all packages
- ESLint and Prettier configuration
- Comprehensive error handling

### Changed

- Refactored API routes to support proper testing
- Improved project structure and organization
- Enhanced documentation consistency
- Standardized code formatting and linting

### Fixed

- Jest mocking issues for OpenAI API calls
- Environment variable loading conflicts
- Test file organization and cleanup
- Documentation inconsistencies

## [1.0.0] - 2024-01-20

### Added

- Initial release of Hedgi AI Agents
- SMB Explainer agent for monthly financial summaries
- Audit Push agent for accounting issue detection
- Cash Flow Runway agent for burn rate analysis
- Savings Finder agent for subscription optimization
- OpenAI GPT-4 integration with JSON mode
- Zod schema validation
- Next.js 14 with App Router
- Monorepo structure with npm workspaces
- TypeScript support throughout
- Basic API testing infrastructure

### Features

- **SMB Explainer**: Provides monthly financial summaries with insights and recommendations
- **Audit Push**: Identifies accounting issues, duplicates, and proposes corrections
- **Cash Flow Runway**: Calculates burn rate, runway projections, and cash flow analysis
- **Savings Finder**: Identifies subscription cost optimization opportunities
- **Health Check**: System health monitoring and status reporting
- **Rate Limiting**: Built-in protection against API abuse
- **Cost Tracking**: Automatic token usage and cost monitoring
- **Performance Monitoring**: Request timing and system health tracking

### Technical Details

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 with JSON mode
- **Validation**: Zod schemas for type-safe data validation
- **Language**: TypeScript with strict mode
- **Package Manager**: npm workspaces
- **Testing**: Jest with comprehensive mocking
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier for consistent code style

### API Endpoints

- `POST /api/ai/smb-explainer` - Monthly financial analysis
- `POST /api/ai/audit-push` - Accounting issue detection
- `POST /api/ai/cash-flow-runway` - Cash flow projections
- `POST /api/ai/savings-finder` - Subscription optimization
- `GET /api/health` - System health check

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (required)
- `NODE_ENV` - Environment (development/production)
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4o)
- `ENABLE_COST_LOGGING` - Enable cost tracking (default: true)

### Dependencies

- **Core**: Next.js 14, React 18, TypeScript 5
- **AI**: OpenAI 4.20.0, tiktoken 1.0.22
- **Validation**: Zod 3.22.0
- **Testing**: Jest 29, ts-jest 29
- **Linting**: ESLint 8, Prettier 3
- **Build**: Turbo 1.10.0

---

## Version History

- **1.0.0** - Initial release with core AI agents
- **Unreleased** - Documentation improvements and testing enhancements

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on contributing to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
