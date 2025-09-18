#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;
import { apps, testimonials } from '../shared/schema.js';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

interface BackupOptions {
  tables: string[];
  outputDir: string;
  databaseUrl?: string;
}

interface BackupResult {
  table: string;
  file: string;
  count: number;
}

async function createBackup(options: BackupOptions) {
  const { tables, outputDir, databaseUrl } = options;
  
  // Use PROD_DATABASE_URL if available, otherwise fall back to DATABASE_URL
  const dbUrl = databaseUrl || process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ No database URL found. Please set PROD_DATABASE_URL or DATABASE_URL environment variable.');
    process.exit(1);
  }

  console.log(`🔌 Connecting to database...`);
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle({ client: pool, schema: { apps, testimonials } });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    const backupResults: BackupResult[] = [];

    if (tables.includes('apps') || tables.includes('all')) {
      console.log('📦 Backing up apps table...');
      const appsData = await db.select().from(apps);
      const appsFile = `${outputDir}/apps_${timestamp}.json`;
      await writeFile(appsFile, JSON.stringify(appsData, null, 2));
      console.log(`✅ Apps backup saved: ${appsFile} (${appsData.length} records)`);
      backupResults.push({ table: 'apps', file: appsFile, count: appsData.length });
    }

    if (tables.includes('testimonials') || tables.includes('all')) {
      console.log('💬 Backing up testimonials table...');
      const testimonialsData = await db.select().from(testimonials);
      const testimonialsFile = `${outputDir}/testimonials_${timestamp}.json`;
      await writeFile(testimonialsFile, JSON.stringify(testimonialsData, null, 2));
      console.log(`✅ Testimonials backup saved: ${testimonialsFile} (${testimonialsData.length} records)`);
      backupResults.push({ table: 'testimonials', file: testimonialsFile, count: testimonialsData.length });
    }

    console.log('\n🎉 Backup completed successfully!');
    console.log('📊 Summary:');
    backupResults.forEach(result => {
      console.log(`  - ${result.table}: ${result.count} records → ${result.file}`);
    });

    return backupResults;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    tables: ['all'],
    outputDir: './backups',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--tables':
        if (i + 1 < args.length) {
          options.tables = args[i + 1].split(',').map(t => t.trim());
          i++;
        }
        break;
      case '--output':
        if (i + 1 < args.length) {
          options.outputDir = args[i + 1];
          i++;
        }
        break;
      case '--db-url':
        if (i + 1 < args.length) {
          options.databaseUrl = args[i + 1];
          i++;
        }
        break;
      case '--help':
        console.log(`
Database Backup Tool

Usage: tsx scripts/backup-db.ts [options]

Options:
  --tables <tables>    Comma-separated list of tables to backup (apps,testimonials,all) [default: all]
  --output <dir>       Output directory for backup files [default: ./backups]
  --db-url <url>       Database URL to backup from [default: PROD_DATABASE_URL or DATABASE_URL]
  --help               Show this help message

Examples:
  tsx scripts/backup-db.ts
  tsx scripts/backup-db.ts --tables apps,testimonials --output ./my-backups
  tsx scripts/backup-db.ts --tables apps --db-url "postgresql://..."
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Validate tables
function validateTables(tables: string[]) {
  const validTables = ['apps', 'testimonials', 'all'];
  const invalidTables = tables.filter(table => !validTables.includes(table));
  
  if (invalidTables.length > 0) {
    console.error(`❌ Invalid table(s): ${invalidTables.join(', ')}`);
    console.error(`Valid tables: ${validTables.join(', ')}`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting database backup...\n');
  
  const options = parseArgs();
  validateTables(options.tables);
  
  await createBackup(options);
}

// Export the backup function for use by other scripts
export { createBackup };

// Run the script
if (import.meta.url === new URL('file://' + process.argv[1]).href) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}