#!/usr/bin/env tsx

/**
 * Quick deployment script for rapid Replit → GitHub → Live Website sync
 */

import { execSync } from 'child_process';

interface DeployOptions {
  message?: string;
  skipBackup?: boolean;
}

async function quickDeploy(options: DeployOptions = {}) {
  try {
    console.log('🚀 Starting quick deployment...');
    
    // Optional: Backup database if needed
    if (!options.skipBackup) {
      console.log('💾 Creating database backup...');
      try {
        execSync('npm run backup-db', { stdio: 'inherit' });
      } catch (e) {
        console.log('⚠️  Database backup skipped (script not found or failed)');
      }
    }
    
    // Clear git locks
    try {
      execSync('rm -f .git/index.lock', { stdio: 'pipe' });
    } catch (e) {
      // Ignore if file doesn't exist
    }
    
    // Git operations
    console.log('📁 Staging all changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Check for changes
    try {
      execSync('git diff --cached --exit-code', { stdio: 'pipe' });
      console.log('✅ No changes to deploy - everything is up to date');
      return;
    } catch (e) {
      // There are changes
    }
    
    // Commit and push
    const commitMessage = options.message || `Quick deploy from Replit - ${new Date().toISOString()}`;
    console.log(`💾 Committing: ${commitMessage}`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('🌐 Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Deployment complete!');
    console.log('🎯 Changes pushed to GitHub - external website should update automatically');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const messageIndex = args.indexOf('--message');
const message = messageIndex !== -1 ? args[messageIndex + 1] : undefined;
const skipBackup = args.includes('--skip-backup');

quickDeploy({ message, skipBackup });