# Environment Variables Setup

This project uses `direnv` to manage environment variables automatically. This prevents conflicts between different projects and ensures the correct API keys are always used.

## Prerequisites

1. **Install direnv** (if not already installed):

   ```bash
   brew install direnv
   ```

2. **Add direnv to your shell** (if not already done):
   ```bash
   echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
   source ~/.zshrc
   ```

## How it works

- When you `cd` into this project directory, `direnv` automatically loads the environment variables from `.envrc`
- When you leave the directory, the variables are unloaded
- This prevents conflicts with other projects that might have different API keys

## Environment Variables

The following variables are automatically set when you enter this project:

- `OPENAI_API_KEY` - Your OpenAI API key for this project
- `NODE_ENV` - Set to "development"
- `OPENAI_MODEL` - Set to "gpt-4o"
- `ENABLE_COST_LOGGING` - Set to "true"
- `PROJECT_ROOT` - Path to the project root
- `WEB_APP_DIR` - Path to the web app directory
- `AI_PACKAGE_DIR` - Path to the AI package directory

## Troubleshooting

If environment variables aren't loading automatically:

1. **Check if direnv is working**:

   ```bash
   direnv status
   ```

2. **Manually load the environment**:

   ```bash
   direnv exec . env | grep OPENAI
   ```

3. **Restart your terminal** to ensure the direnv hook is loaded

4. **Check if the .envrc file is allowed**:
   ```bash
   direnv allow
   ```

## Security

- The `.envrc` file contains sensitive API keys
- Never commit this file to version control
- The file is already in `.gitignore`
- Only run `direnv allow` on trusted `.envrc` files

## Benefits

- ✅ **No more API key conflicts** between projects
- ✅ **Automatic environment loading** when entering the project
- ✅ **Clean environment** when leaving the project
- ✅ **Project-specific configuration** that doesn't affect other projects
- ✅ **Easy team onboarding** - just run `direnv allow` after cloning
