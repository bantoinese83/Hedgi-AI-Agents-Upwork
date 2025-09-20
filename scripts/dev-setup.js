#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Development setup script for Hedgi AI Agents
 * Handles port cleanup, dependency installation, and development server startup
 */

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.warn(stderr);
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function setupDevelopment() {
  console.log('🚀 Setting up Hedgi AI Agents development environment...\n');

  try {
    // Step 1: Kill any processes on ports
    await runCommand('node scripts/kill-port.js', 'Cleaning up ports');

    // Step 2: Install dependencies for AI package
    await runCommand(
      'npm install --prefix packages/ai',
      'Installing AI package dependencies'
    );

    // Step 3: Build AI package
    await runCommand(
      'npm run build --prefix packages/ai',
      'Building AI package'
    );

    // Step 4: Install dependencies for web app
    await runCommand(
      'npm install --prefix apps/web',
      'Installing web app dependencies'
    );

    // Step 5: Start development server
    console.log('\n🎉 Development environment ready!');
    console.log('📡 Starting development server...');
    console.log('🌐 Web app will be available at: http://localhost:3000');
    console.log('📋 API endpoints:');
    console.log('   - POST /api/ai/smb-explainer');
    console.log('   - POST /api/ai/audit-push');
    console.log('   - POST /api/ai/savings-finder');
    console.log('   - POST /api/ai/cash-flow-runway');
    console.log('\n💡 Use Ctrl+C to stop the server\n');

    // Start the development server
    const { spawn } = require('child_process');
    const devProcess = spawn('npm', ['run', 'dev', '--prefix', 'apps/web'], {
      stdio: 'inherit',
      shell: true,
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping development server...');
      devProcess.kill('SIGINT');
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDevelopment();
