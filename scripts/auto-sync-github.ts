#!/usr/bin/env tsx

/**
 * Auto-sync script to push Replit changes to GitHub
 * Run this after making changes to sync to your external website
 */

import { execSync } from 'child_process';

async function autoSyncToGitHub() {
  try {
    console.log('🔄 Starting auto-sync to GitHub...');
    
    // Clear any git locks
    console.log('🧹 Clearing git locks...');
    try {
      execSync('rm -f .git/index.lock', { stdio: 'inherit' });
    } catch (e) {
      // Lock file might not exist, that's fine
    }
    
    // Add all changes
    console.log('📁 Adding all changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Check if there are changes to commit
    try {
      execSync('git diff --cached --exit-code', { stdio: 'pipe' });
      console.log('✅ No changes to sync - repository is up to date');
      return;
    } catch (e) {
      // There are changes to commit
    }
    
    // Commit with timestamp
    const timestamp = new Date().toISOString();
    const commitMessage = `Auto-sync from Replit - ${timestamp}`;
    console.log(`💾 Committing changes: ${commitMessage}`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Successfully synced to GitHub!');
    console.log('🌐 Your external website should update automatically if connected to GitHub');
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
autoSyncToGitHub();