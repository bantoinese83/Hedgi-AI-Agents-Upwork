# Port Management Scripts

This directory contains scripts to automatically kill processes running on specific ports before starting the development server.

## Scripts

### `kill-port.js` (JavaScript)

- Cross-platform port killer
- Works on Windows, macOS, and Linux
- Automatically detects and kills processes on specified ports

### `kill-port.ts` (TypeScript)

- TypeScript version with full type safety
- Same functionality as JavaScript version
- Requires `ts-node` to run

## Usage

### Manual Port Killing

```bash
# Kill processes on default ports (3000, 3001, 3002, 3003)
node scripts/kill-port.js

# Kill processes on specific ports
node scripts/kill-port.js 3000 8080 9000

# Using TypeScript version
npx ts-node scripts/kill-port.ts 3000 8080
```

### Automatic Port Killing with Dev Server

```bash
# Root level - kills ports then starts all services
npm run dev

# Web app only - kills ports then starts Next.js
cd apps/web
npm run dev

# Clean start (explicit port killing)
npm run dev:clean
```

## How It Works

### Windows

1. Uses `netstat -aon` to find processes using the port
2. Extracts the Process ID (PID)
3. Uses `taskkill /F /PID` to forcefully terminate the process

### Unix-based Systems (macOS, Linux)

1. Uses `lsof -ti tcp:PORT` to find the PID
2. Uses `xargs kill -9` to forcefully terminate the process

## Error Handling

- ✅ Gracefully handles cases where no process is found on the port
- ✅ Provides clear success/error messages
- ✅ Continues execution even if some ports fail to clear
- ✅ Cross-platform compatibility

## Integration

The scripts are automatically integrated into the npm scripts:

- `npm run dev` - Kills ports then starts development
- `npm run dev:clean` - Explicit port killing then development
- `npm run kill-ports` - Just kill ports without starting dev server

This ensures that your development environment always starts clean without port conflicts!
