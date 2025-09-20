# Hedgi AI Agents - Postman Collection

This directory contains comprehensive Postman collections and environments for testing the Hedgi AI Agents API.

## 📁 Files

- **`Hedgi-AI-Agents.postman_collection.json`** - Main API collection with all endpoints
- **`Hedgi-AI-Agents-Environment.postman_environment.json`** - Environment variables for different configurations
- **`README.md`** - This documentation file

## 🚀 Quick Start

### 1. Import Collection and Environment

1. **Import Collection**:
   - Open Postman
   - Click "Import" → "Upload Files"
   - Select `Hedgi-AI-Agents.postman_collection.json`

2. **Import Environment**:
   - Click "Import" → "Upload Files"
   - Select `Hedgi-AI-Agents-Environment.postman_environment.json`
   - Select the environment in the top-right dropdown

### 2. Configure Environment Variables

Update the following variables in your environment:

- **`baseUrl`**: Set to your API base URL (default: `http://localhost:3000`)
- **`openaiApiKey`**: Set to your actual OpenAI API key
- **`testBusinessName`**: Customize for your testing needs
- **`testMonth`** and **`testYear`**: Set current testing period

### 3. Start Testing

1. **Health Check**: Run the Health Check request first to verify API connectivity
2. **AI Agents**: Test individual AI agent endpoints
3. **Error Testing**: Verify error handling scenarios
4. **Performance Testing**: Check API performance under load

## 📋 Collection Structure

### Health & Monitoring

- **Health Check**: System status, performance metrics, rate limit info

### AI Agents

- **SMB Explainer**: Monthly financial summaries and insights
  - Basic Monthly Summary
  - Minimal Data Test
- **Audit Push**: Accounting issue detection and correction
  - Duplicate Detection
- **Cash Flow Runway**: Burn rate analysis and projections
  - Monthly Runway Analysis
- **Savings Finder**: Subscription cost optimization
  - Subscription Analysis

### Error Testing

- **Invalid Request Data**: Test API error handling
- **Rate Limit Test**: Verify rate limiting behavior

### Performance Testing

- **Concurrent Requests**: Load testing scenarios

## 🧪 Automated Testing

### Built-in Tests

Each request includes comprehensive automated tests:

#### Response Validation

- ✅ Status code verification
- ✅ Response time checks
- ✅ JSON structure validation
- ✅ Required field presence
- ✅ Data type validation

#### Business Logic Tests

- ✅ Success response validation
- ✅ Error handling verification
- ✅ Rate limit detection
- ✅ Performance metrics logging

#### Example Test Script

```javascript
// Test response status
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

// Test response structure
pm.test('Response has required fields', function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('success');
  pm.expect(jsonData).to.have.property('data');
  pm.expect(jsonData).to.have.property('metadata');
});
```

### Global Tests

The collection includes global pre-request and test scripts:

#### Pre-request Scripts

- Set request timeout
- Log request details
- Prepare test data

#### Global Test Scripts

- API accessibility check
- Response time validation
- JSON format verification
- Performance metrics logging

## 🔧 Environment Variables

### Required Variables

| Variable       | Description    | Example                 |
| -------------- | -------------- | ----------------------- |
| `baseUrl`      | API base URL   | `http://localhost:3000` |
| `openaiApiKey` | OpenAI API key | `sk-proj-...`           |

### Optional Variables

| Variable           | Description          | Default              |
| ------------------ | -------------------- | -------------------- |
| `apiVersion`       | API version          | `v1`                 |
| `timeout`          | Request timeout (ms) | `30000`              |
| `testBusinessName` | Test business name   | `Test Business Corp` |
| `testMonth`        | Test month           | `January`            |
| `testYear`         | Test year            | `2024`               |

### Dynamic Variables

These are set automatically by the collection:

| Variable             | Description           | Set By        |
| -------------------- | --------------------- | ------------- |
| `rateLimitRemaining` | Current rate limit    | Health Check  |
| `rateLimitReset`     | Rate limit reset time | Health Check  |
| `lastSMBResponse`    | Last SMB response     | SMB Explainer |

## 📊 Test Scenarios

### 1. Basic Functionality

- Health check verification
- All AI agent endpoints
- Response structure validation
- Error handling

### 2. Edge Cases

- Minimal required data
- Invalid request formats
- Missing required fields
- Rate limit scenarios

### 3. Performance Testing

- Response time validation
- Concurrent request handling
- Load testing scenarios

### 4. Error Scenarios

- Invalid JSON
- Missing authentication
- Rate limit exceeded
- Server errors

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid request data",
  "data": {},
  "metadata": { ... }
}
```

#### 429 Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "data": {},
  "metadata": { ... }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "data": {},
  "metadata": { ... }
}
```

## 📈 Performance Monitoring

### Response Time Thresholds

- **Health Check**: < 1000ms
- **AI Agents**: < 10000ms
- **Error Responses**: < 5000ms

### Metrics Tracked

- Response time
- Status codes
- Response size
- Rate limit status
- Error rates

## 🔄 CI/CD Integration

### Newman (Command Line)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run Hedgi-AI-Agents.postman_collection.json \
  -e Hedgi-AI-Agents-Environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### GitHub Actions

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Newman
        run: npm install -g newman
      - name: Run API Tests
        run: |
          newman run tools/postman/Hedgi-AI-Agents.postman_collection.json \
            -e tools/postman/Hedgi-AI-Agents-Environment.postman_environment.json
```

## 🛠️ Customization

### Adding New Tests

1. **Create New Request**:
   - Add to appropriate folder
   - Set up request body
   - Configure headers

2. **Add Test Scripts**:

   ```javascript
   pm.test('Custom test name', function () {
     // Test implementation
   });
   ```

3. **Update Environment**:
   - Add new variables as needed
   - Update existing values

### Modifying Existing Tests

1. **Update Request Data**:
   - Modify request body
   - Change test parameters
   - Update expected responses

2. **Enhance Test Scripts**:
   - Add additional validations
   - Improve error handling
   - Add performance checks

## 📚 Best Practices

### Request Organization

- Group related requests in folders
- Use descriptive names
- Include detailed descriptions
- Maintain consistent naming

### Test Coverage

- Test all success scenarios
- Verify error conditions
- Check edge cases
- Validate performance

### Environment Management

- Use environment variables
- Separate dev/staging/prod
- Keep secrets secure
- Document all variables

### Documentation

- Update descriptions regularly
- Include usage examples
- Document test scenarios
- Maintain change log

## 🆘 Troubleshooting

### Common Issues

#### Collection Won't Import

- Verify JSON format
- Check file permissions
- Ensure Postman version compatibility

#### Tests Failing

- Check environment variables
- Verify API is running
- Review test scripts
- Check response format

#### Environment Issues

- Verify variable names
- Check variable types
- Ensure proper scoping
- Validate values

### Debug Tips

1. **Enable Console Logging**:

   ```javascript
   console.log('Debug info:', pm.response.json());
   ```

2. **Check Response Details**:
   - Status code
   - Response time
   - Headers
   - Body content

3. **Validate Environment**:
   - Variable values
   - Scoping
   - Types

## 📞 Support

For issues with the Postman collection:

1. Check this documentation
2. Review test scripts
3. Verify environment setup
4. Check API documentation
5. Create an issue in the repository

---

## 📄 License

This Postman collection is part of the Hedgi AI Agents project and is licensed under the MIT License.
