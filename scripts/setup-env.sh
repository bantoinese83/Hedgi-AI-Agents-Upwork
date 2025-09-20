#!/bin/bash

# Setup script for environment variables
echo "Setting up environment variables for Hedgi AI Agents..."

# Check if .env.local exists in web app
if [ ! -f "apps/web/.env.local" ]; then
    echo "Creating .env.local file in apps/web/"
    cat > apps/web/.env.local << EOF
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Environment
NODE_ENV=development

# Optional: Custom OpenAI model
OPENAI_MODEL=gpt-4

# Optional: Enable/disable cost logging
ENABLE_COST_LOGGING=true
EOF
    echo "✅ Created apps/web/.env.local"
else
    echo "⚠️  apps/web/.env.local already exists"
fi

# Check if .env.local exists in root
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file in root"
    cat > .env.local << EOF
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Environment
NODE_ENV=development

# Optional: Custom OpenAI model
OPENAI_MODEL=gpt-4

# Optional: Enable/disable cost logging
ENABLE_COST_LOGGING=true
EOF
    echo "✅ Created .env.local"
else
    echo "⚠️  .env.local already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Edit apps/web/.env.local and replace 'your-openai-api-key-here' with your actual OpenAI API key"
echo "2. Make sure your OpenAI account has billing set up and is active"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "⚠️  Important: Make sure your OpenAI API key is valid and your account has billing enabled!"
