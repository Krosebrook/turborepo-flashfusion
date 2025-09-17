#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const MAX_LINES_PER_COMMIT = 500;
const WARNING_LINES_PER_COMMIT = 200;

function getCommitStats() {
  try {
    // Get staged files and their line changes
    const diffOutput = execSync('git diff --cached --stat', { encoding: 'utf8' });

    if (!diffOutput.trim()) {
      console.log('✅ No staged changes to check');
      return { success: true };
    }

    // Parse the diff stat output
    const lines = diffOutput.trim().split('\n');
    const summaryLine = lines[lines.length - 1];

    // Extract total changes from summary line (e.g., "3 files changed, 150 insertions(+), 20 deletions(-)")
    const match = summaryLine.match(/(\d+)\s+insertion|(\d+)\s+deletion/g);

    if (!match) {
      console.log('⚠️  Could not determine commit size, proceeding...');
      return { success: true };
    }

    let totalLines = 0;
    match.forEach(m => {
      const num = parseInt(m.match(/\d+/)[0]);
      totalLines += num;
    });

    // Check file count
    const filesMatch = summaryLine.match(/(\d+)\s+files?\s+changed/);
    const fileCount = filesMatch ? parseInt(filesMatch[1]) : 0;

    console.log(`\n📊 Commit Size Check:`);
    console.log(`   Files changed: ${fileCount}`);
    console.log(`   Total lines changed: ${totalLines}`);

    if (totalLines > MAX_LINES_PER_COMMIT) {
      console.log(`\n❌ COMMIT TOO LARGE!`);
      console.log(`   Maximum allowed: ${MAX_LINES_PER_COMMIT} lines`);
      console.log(`   Your commit: ${totalLines} lines`);
      console.log(`\n💡 Consider splitting this commit:`);
      console.log(`   git reset HEAD .                    # Unstage all`);
      console.log(`   git add <file1> <file2>            # Stage related files`);
      console.log(`   git commit -m "focused message"    # Commit atomically`);
      console.log(`   # Repeat for remaining files`);
      return { success: false };
    }

    if (totalLines > WARNING_LINES_PER_COMMIT) {
      console.log(`\n⚠️  Large commit warning:`);
      console.log(`   Recommended max: ${WARNING_LINES_PER_COMMIT} lines`);
      console.log(`   Your commit: ${totalLines} lines`);
      console.log(`   Consider if this could be split into smaller, atomic commits.`);
    }

    if (fileCount > 10) {
      console.log(`\n⚠️  Many files changed: ${fileCount}`);
      console.log(`   Consider grouping related changes into separate commits.`);
    }

    console.log(`✅ Commit size check passed\n`);
    return { success: true };

  } catch (error) {
    console.log(`⚠️  Error checking commit size: ${error.message}`);
    console.log(`   Proceeding with commit...`);
    return { success: true }; // Don't block commits on script errors
  }
}

// Show detailed diff for large commits
function showDetailedChanges() {
  try {
    console.log(`\n📋 Files being committed:`);
    const stagedFiles = execSync('git diff --cached --name-status', { encoding: 'utf8' });
    console.log(stagedFiles);
  } catch (error) {
    console.log('Could not show detailed changes');
  }
}

const result = getCommitStats();
if (!result.success) {
  showDetailedChanges();
  process.exit(1);
}