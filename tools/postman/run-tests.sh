#!/bin/bash

# Hedgi AI Agents - Postman Collection Test Runner
# This script runs the Postman collection tests using Newman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COLLECTION_FILE="Hedgi-AI-Agents.postman_collection.json"
ENVIRONMENT_FILE="Hedgi-AI-Agents-Environment.postman_environment.json"
RESULTS_DIR="test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default values
BASE_URL="http://localhost:3000"
TIMEOUT="30000"
VERBOSE=false
REPORT_FORMAT="cli,json,html"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL          API base URL (default: http://localhost:3000)"
    echo "  -t, --timeout MS       Request timeout in milliseconds (default: 30000)"
    echo "  -v, --verbose          Enable verbose output"
    echo "  -r, --report FORMAT    Report format (default: cli,json,html)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with defaults"
    echo "  $0 -u http://localhost:3001          # Custom URL"
    echo "  $0 -v -r cli,json                   # Verbose with custom reports"
    echo "  $0 -t 60000                         # 60 second timeout"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Newman is installed
    if ! command -v newman &> /dev/null; then
        print_error "Newman is not installed. Please install it with: npm install -g newman"
        exit 1
    fi
    
    # Check if collection file exists
    if [ ! -f "$COLLECTION_FILE" ]; then
        print_error "Collection file not found: $COLLECTION_FILE"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENVIRONMENT_FILE" ]; then
        print_warning "Environment file not found: $ENVIRONMENT_FILE"
        print_warning "Running without environment file..."
        ENVIRONMENT_FILE=""
    fi
    
    print_success "Dependencies check passed"
}

# Function to create results directory
create_results_dir() {
    if [ ! -d "$RESULTS_DIR" ]; then
        print_status "Creating results directory: $RESULTS_DIR"
        mkdir -p "$RESULTS_DIR"
    fi
}

# Function to run tests
run_tests() {
    print_status "Starting API tests..."
    print_status "Collection: $COLLECTION_FILE"
    print_status "Environment: ${ENVIRONMENT_FILE:-'None'}"
    print_status "Base URL: $BASE_URL"
    print_status "Timeout: $TIMEOUT ms"
    print_status "Reports: $REPORT_FORMAT"
    echo ""
    
    # Build Newman command
    NEWMAN_CMD="newman run $COLLECTION_FILE"
    
    # Add environment file if it exists
    if [ -n "$ENVIRONMENT_FILE" ]; then
        NEWMAN_CMD="$NEWMAN_CMD -e $ENVIRONMENT_FILE"
    fi
    
    # Add global variables
    NEWMAN_CMD="$NEWMAN_CMD --global-var baseUrl=$BASE_URL"
    NEWMAN_CMD="$NEWMAN_CMD --global-var timeout=$TIMEOUT"
    
    # Add reporters
    NEWMAN_CMD="$NEWMAN_CMD --reporters $REPORT_FORMAT"
    
    # Add report file paths
    NEWMAN_CMD="$NEWMAN_CMD --reporter-json-export $RESULTS_DIR/results_$TIMESTAMP.json"
    NEWMAN_CMD="$NEWMAN_CMD --reporter-html-export $RESULTS_DIR/report_$TIMESTAMP.html"
    
    # Add verbose flag if requested
    if [ "$VERBOSE" = true ]; then
        NEWMAN_CMD="$NEWMAN_CMD --verbose"
    fi
    
    # Run the tests
    print_status "Executing: $NEWMAN_CMD"
    echo ""
    
    if eval $NEWMAN_CMD; then
        print_success "All tests completed successfully!"
        print_status "Results saved to: $RESULTS_DIR/"
        return 0
    else
        print_error "Some tests failed!"
        print_status "Check results in: $RESULTS_DIR/"
        return 1
    fi
}

# Function to show results summary
show_summary() {
    if [ -f "$RESULTS_DIR/results_$TIMESTAMP.json" ]; then
        print_status "Test Summary:"
        echo ""
        
        # Extract summary from JSON results
        if command -v jq &> /dev/null; then
            echo "Total Requests: $(jq '.run.stats.requests.total' "$RESULTS_DIR/results_$TIMESTAMP.json")"
            echo "Passed: $(jq '.run.stats.requests.passed' "$RESULTS_DIR/results_$TIMESTAMP.json")"
            echo "Failed: $(jq '.run.stats.requests.failed' "$RESULTS_DIR/results_$TIMESTAMP.json")"
            echo "Total Tests: $(jq '.run.stats.tests.total' "$RESULTS_DIR/results_$TIMESTAMP.json")"
            echo "Test Passed: $(jq '.run.stats.tests.passed' "$RESULTS_DIR/results_$TIMESTAMP.json")"
            echo "Test Failed: $(jq '.run.stats.tests.failed' "$RESULTS_DIR/results_$TIMESTAMP.json")"
        else
            print_warning "jq not found. Install jq for detailed summary."
        fi
        
        echo ""
        print_status "Detailed results available in:"
        echo "  - JSON: $RESULTS_DIR/results_$TIMESTAMP.json"
        echo "  - HTML: $RESULTS_DIR/report_$TIMESTAMP.html"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -r|--report)
            REPORT_FORMAT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "🧪 Hedgi AI Agents - Postman Test Runner"
    echo "========================================"
    echo ""
    
    check_dependencies
    create_results_dir
    run_tests
    show_summary
    
    echo ""
    print_status "Test run completed at $(date)"
}

# Run main function
main "$@"
