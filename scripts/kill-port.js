#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Kills the process running on the specified port.
 * @param {number} port - The port number to free up.
 */
async function killProcessOnPort(port) {
  try {
    let command;

    if (process.platform === 'win32') {
      // Windows: Find the PID using 'netstat' and 'findstr', then kill it using 'taskkill'
      command = `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`;
    } else {
      // Unix-based systems: Find the PID using 'lsof', then kill it using 'kill'
      command = `lsof -ti tcp:${port} | xargs kill -9`;
    }

    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log(`✅ Successfully killed process on port ${port}`);
    }
    if (stderr && !stderr.includes('No such process')) {
      console.warn(
        `⚠️  Warning while killing process on port ${port}: ${stderr}`
      );
    }
  } catch (error) {
    // It's okay if no process is found on the port
    if (
      error.message.includes('No such process') ||
      error.message.includes('not found')
    ) {
      console.log(`ℹ️  No process found on port ${port}`);
    } else {
      console.error(
        `❌ Failed to kill process on port ${port}: ${error.message}`
      );
    }
  }
}

/**
 * Kills processes on multiple ports
 * @param {number[]} ports - Array of port numbers to free up.
 */
async function killProcessesOnPorts(ports) {
  console.log('🔍 Checking for processes on ports:', ports.join(', '));

  for (const port of ports) {
    await killProcessOnPort(port);
  }

  console.log('✅ Port cleanup completed');
}

// Get ports from command line arguments or use default ports
const ports = process.argv
  .slice(2)
  .map(Number)
  .filter((port) => !isNaN(port));

if (ports.length === 0) {
  // Default ports for Hedgi AI Agents
  const defaultPorts = [3000, 3001, 3002, 3003];
  killProcessesOnPorts(defaultPorts);
} else {
  killProcessesOnPorts(ports);
}
