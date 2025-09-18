#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { apps, testimonials } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import { createBackup } from './backup-db.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

interface SyncOptions {
  dryRun: boolean;
  replaceMode: boolean;
  tables: string[];
  devDatabaseUrl?: string;
  prodDatabaseUrl?: string;
}

interface SyncResult {
  table: string;
  inserted: number;
  updated: number;
  deactivated: number;
  duplicates: string[];
  changes: Array<{
    action: 'insert' | 'update' | 'deactivate';
    record: any;
    businessKey: string;
  }>;
}

interface SyncSummary {
  totalInserted: number;
  totalUpdated: number;
  totalDeactivated: number;
  tableResults: SyncResult[];
  hasDuplicates: boolean;
}

// Generate content hash for testimonials business key
function generateContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 8);
}

// Get business key for apps (using name)
function getAppBusinessKey(app: any): string {
  return app.name;
}

// Get business key for testimonials (using name + content hash)  
function getTestimonialBusinessKey(testimonial: any): string {
  const contentHash = generateContentHash(testimonial.content);
  return `${testimonial.name}-${contentHash}`;
}

// Preflight check for business key duplicates
function checkBusinessKeyDuplicates(data: any[], table: 'apps' | 'testimonials'): string[] {
  const businessKeys = new Set<string>();
  const duplicates: string[] = [];

  data.forEach(record => {
    const businessKey = table === 'apps' 
      ? getAppBusinessKey(record)
      : getTestimonialBusinessKey(record);
    
    if (businessKeys.has(businessKey)) {
      duplicates.push(businessKey);
    } else {
      businessKeys.add(businessKey);
    }
  });

  return duplicates;
}

// Single atomic sync operation for all tables
async function performAtomicSync(
  devDb: any,
  prodDb: any,
  options: SyncOptions
): Promise<SyncSummary> {
  console.log('\n🔄 Starting atomic database sync...');
  
  // Determine which tables to sync
  const tablesToSync = options.tables.includes('all') 
    ? ['apps', 'testimonials'] 
    : options.tables.filter(table => ['apps', 'testimonials'].includes(table));

  if (tablesToSync.length === 0) {
    throw new Error('No valid tables specified for sync');
  }

  console.log(`📋 Tables to sync: ${tablesToSync.join(', ')}`);

  const summary: SyncSummary = {
    totalInserted: 0,
    totalUpdated: 0,
    totalDeactivated: 0,
    tableResults: [],
    hasDuplicates: false
  };

  // Preflight checks - load all data and check for duplicates
  console.log('\n🔍 Running preflight checks...');
  const dataCache = new Map();
  
  for (const table of tablesToSync) {
    console.log(`  Checking ${table} table...`);
    
    let devData: any[], prodData: any[];
    
    if (table === 'apps') {
      [devData, prodData] = await Promise.all([
        devDb.select().from(apps),
        prodDb.select().from(apps)
      ]);
    } else {
      [devData, prodData] = await Promise.all([
        devDb.select().from(testimonials),
        prodDb.select().from(testimonials)
      ]);
    }

    // Check for business key duplicates in dev data
    const duplicates = checkBusinessKeyDuplicates(devData, table as 'apps' | 'testimonials');
    if (duplicates.length > 0) {
      console.log(`    ❌ Found ${duplicates.length} duplicate business keys: ${duplicates.join(', ')}`);
      summary.hasDuplicates = true;
    } else {
      console.log(`    ✅ No duplicate business keys found`);
    }

    dataCache.set(table, { devData, prodData, duplicates });
  }

  // Abort if duplicates found
  if (summary.hasDuplicates) {
    throw new Error('Preflight checks failed: Duplicate business keys found. Please resolve duplicates before syncing.');
  }

  console.log('✅ All preflight checks passed');

  // Single atomic transaction for all tables
  if (!options.dryRun) {
    console.log('\n⚡ Executing atomic transaction...');
    
    await prodDb.transaction(async (tx: any) => {
      // Process tables in order: apps first, then testimonials
      for (const table of tablesToSync) {
        const result = await syncSingleTable(tx, dataCache.get(table), table as 'apps' | 'testimonials', options);
        summary.tableResults.push(result);
        summary.totalInserted += result.inserted;
        summary.totalUpdated += result.updated;
        summary.totalDeactivated += result.deactivated;
        
        console.log(`  ✅ ${table}: ${result.inserted} inserted, ${result.updated} updated, ${result.deactivated} deactivated`);
      }
    });
    
    console.log('✅ Transaction completed successfully');
    
  } else {
    // Dry run mode - simulate changes
    console.log('\n🧪 Simulating changes (dry run)...');
    
    for (const table of tablesToSync) {
      const result = await simulateTableSync(dataCache.get(table), table as 'apps' | 'testimonials', options);
      summary.tableResults.push(result);
      summary.totalInserted += result.inserted;
      summary.totalUpdated += result.updated;
      summary.totalDeactivated += result.deactivated;
      
      console.log(`  📝 ${table}: ${result.inserted} would be inserted, ${result.updated} updated, ${result.deactivated} deactivated`);
    }
  }

  return summary;
}

// Sync a single table within an existing transaction
async function syncSingleTable(
  tx: any,
  cachedData: { devData: any[], prodData: any[], duplicates: string[] },
  table: 'apps' | 'testimonials',
  options: SyncOptions
): Promise<SyncResult> {
  const { devData, prodData } = cachedData;
  
  const result: SyncResult = {
    table,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    duplicates: cachedData.duplicates,
    changes: []
  };

  // Create maps for efficient lookup
  const prodMap = new Map();
  const devMap = new Map();

  // Build production map using business keys
  prodData.forEach(record => {
    const businessKey = table === 'apps' 
      ? getAppBusinessKey(record)
      : getTestimonialBusinessKey(record);
    prodMap.set(businessKey, record);
  });

  // Build dev map using business keys  
  devData.forEach(record => {
    const businessKey = table === 'apps'
      ? getAppBusinessKey(record) 
      : getTestimonialBusinessKey(record);
    devMap.set(businessKey, record);
  });

  // Process each dev record
  for (const devRecord of devData) {
    const businessKey = table === 'apps'
      ? getAppBusinessKey(devRecord)
      : getTestimonialBusinessKey(devRecord);

    const prodRecord = prodMap.get(businessKey);
    
    if (prodRecord) {
      // Check if update is needed (simple JSON comparison, excluding id, createdAt, updatedAt)
      const devClean = { ...devRecord };
      const prodClean = { ...prodRecord };
      delete devClean.id;
      delete devClean.createdAt;
      delete devClean.updatedAt;
      delete prodClean.id;
      delete prodClean.createdAt;
      delete prodClean.updatedAt;

      if (JSON.stringify(devClean) !== JSON.stringify(prodClean)) {
        // Update existing record
        const updateData = { 
          ...devRecord, 
          updatedAt: new Date(),
          isActive: true // Ensure it's active when updated
        };
        delete updateData.id;
        delete updateData.createdAt;

        if (table === 'apps') {
          await tx.update(apps).set(updateData).where(eq(apps.id, prodRecord.id));
        } else {
          await tx.update(testimonials).set(updateData).where(eq(testimonials.id, prodRecord.id));
        }

        result.updated++;
        result.changes.push({
          action: 'update',
          record: updateData,
          businessKey
        });
      }
    } else {
      // Insert new record
      const insertData = { ...devRecord };
      delete insertData.id; // Let database generate new ID

      if (table === 'apps') {
        await tx.insert(apps).values(insertData);
      } else {
        await tx.insert(testimonials).values(insertData);
      }

      result.inserted++;
      result.changes.push({
        action: 'insert', 
        record: insertData,
        businessKey
      });
    }
  }

  // Handle deleted records (replace mode)
  if (options.replaceMode) {
    for (const [businessKey, prodRecord] of prodMap.entries()) {
      if (!devMap.has(businessKey) && prodRecord.isActive !== false) {
        // Soft delete by setting isActive = false
        if (table === 'apps') {
          await tx.update(apps)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(apps.id, prodRecord.id));
        } else {
          await tx.update(testimonials)
            .set({ isActive: false })
            .where(eq(testimonials.id, prodRecord.id));
        }

        result.deactivated++;
        result.changes.push({
          action: 'deactivate',
          record: prodRecord,
          businessKey
        });
      }
    }
  }

  return result;
}

// Simulate table sync for dry run
async function simulateTableSync(
  cachedData: { devData: any[], prodData: any[], duplicates: string[] },
  table: 'apps' | 'testimonials',
  options: SyncOptions
): Promise<SyncResult> {
  const { devData, prodData } = cachedData;
  
  const result: SyncResult = {
    table,
    inserted: 0,
    updated: 0,
    deactivated: 0,
    duplicates: cachedData.duplicates,
    changes: []
  };

  // Create maps for efficient lookup
  const prodMap = new Map();
  const devMap = new Map();

  // Build production map using business keys
  prodData.forEach(record => {
    const businessKey = table === 'apps' 
      ? getAppBusinessKey(record)
      : getTestimonialBusinessKey(record);
    prodMap.set(businessKey, record);
  });

  // Build dev map using business keys  
  devData.forEach(record => {
    const businessKey = table === 'apps'
      ? getAppBusinessKey(record) 
      : getTestimonialBusinessKey(record);
    devMap.set(businessKey, record);
  });

  // Simulate processing each dev record
  for (const devRecord of devData) {
    const businessKey = table === 'apps'
      ? getAppBusinessKey(devRecord)
      : getTestimonialBusinessKey(devRecord);

    const prodRecord = prodMap.get(businessKey);
    
    if (prodRecord) {
      // Check if update needed
      const devClean = { ...devRecord };
      const prodClean = { ...prodRecord };
      delete devClean.id;
      delete devClean.createdAt; 
      delete devClean.updatedAt;
      delete prodClean.id;
      delete prodClean.createdAt;
      delete prodClean.updatedAt;

      if (JSON.stringify(devClean) !== JSON.stringify(prodClean)) {
        result.updated++;
        result.changes.push({
          action: 'update',
          record: devRecord,
          businessKey
        });
      }
    } else {
      result.inserted++;
      result.changes.push({
        action: 'insert',
        record: devRecord,
        businessKey
      });
    }
  }

  // Handle deleted records in dry run
  if (options.replaceMode) {
    for (const [businessKey, prodRecord] of prodMap.entries()) {
      if (!devMap.has(businessKey) && prodRecord.isActive !== false) {
        result.deactivated++;
        result.changes.push({
          action: 'deactivate',
          record: prodRecord,
          businessKey
        });
      }
    }
  }

  return result;
}

async function performSync(options: SyncOptions) {
  // Use appropriate database URLs
  const devUrl = options.devDatabaseUrl || process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  const prodUrl = options.prodDatabaseUrl || process.env.PROD_DATABASE_URL;

  if (!devUrl) {
    console.error('❌ No development database URL found. Please set DEV_DATABASE_URL or DATABASE_URL environment variable.');
    process.exit(1);
  }

  if (!prodUrl) {
    console.error('❌ No production database URL found. Please set PROD_DATABASE_URL environment variable.');
    process.exit(1);
  }

  console.log(`🔌 Connecting to databases...`);
  console.log(`  📍 Dev: [configured]`);
  console.log(`  📍 Prod: [configured]`);

  const devPool = new Pool({ connectionString: devUrl });
  const prodPool = new Pool({ connectionString: prodUrl });
  const devDb = drizzle({ client: devPool, schema: { apps, testimonials } });
  const prodDb = drizzle({ client: prodPool, schema: { apps, testimonials } });

  try {
    console.log(`\n${options.dryRun ? '🧪 DRY RUN MODE' : '🚀 SYNC MODE'} - ${options.replaceMode ? 'with replace' : 'upsert only'}`);
    
    if (options.dryRun) {
      console.log('📝 No changes will be made to the production database');
    }

    // Create backup before sync (only if not dry run)
    if (!options.dryRun) {
      console.log('\n💾 Creating backup before sync...');
      try {
        await createBackup({
          tables: options.tables.includes('all') ? ['all'] : options.tables,
          outputDir: './backups',
          databaseUrl: prodUrl
        });
        console.log('✅ Backup created successfully');
      } catch (backupError) {
        console.error('❌ Backup failed:', backupError);
        throw new Error('Backup failed - aborting sync for safety');
      }
    }

    // Perform atomic sync
    const summary = await performAtomicSync(devDb, prodDb, options);

    // Print summary
    console.log('\n📊 Sync Summary:');
    console.log('═══════════════════════════════════════════════════');
    
    summary.tableResults.forEach(result => {
      console.log(`\n📋 ${result.table.toUpperCase()}`);
      console.log(`  ✅ Inserted: ${result.inserted}`);
      console.log(`  🔄 Updated: ${result.updated}`);
      console.log(`  ⏸️  Deactivated: ${result.deactivated}`);

      // Show detailed changes if requested
      if (process.argv.includes('--verbose')) {
        result.changes.forEach(change => {
          console.log(`    ${change.action}: ${change.businessKey}`);
        });
      }
    });

    console.log(`\n🎯 TOTAL CHANGES:`);
    console.log(`  ✅ ${summary.totalInserted} inserted`);
    console.log(`  🔄 ${summary.totalUpdated} updated`);  
    console.log(`  ⏸️  ${summary.totalDeactivated} deactivated`);

    if (options.dryRun) {
      console.log('\n💡 Run without --dry-run to apply these changes');
    } else {
      console.log('\n🎉 Sync completed successfully!');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.error('🔄 All changes have been rolled back due to transaction failure');
    process.exit(1);
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    dryRun: false,
    replaceMode: false,
    tables: ['all'],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--replace':
        options.replaceMode = true;
        break;
      case '--tables':
        if (i + 1 < args.length) {
          options.tables = args[i + 1].split(',').map(t => t.trim());
          i++;
        }
        break;
      case '--dev-db-url':
        if (i + 1 < args.length) {
          options.devDatabaseUrl = args[i + 1];
          i++;
        }
        break;
      case '--prod-db-url':
        if (i + 1 < args.length) {
          options.prodDatabaseUrl = args[i + 1];
          i++;
        }
        break;
      case '--help':
        console.log(`
Database Sync Tool

Usage: tsx scripts/sync-db.ts [options]

Options:
  --dry-run              Show planned changes without executing them
  --replace              Enable soft delete of records not in dev (sets isActive=false)
  --tables <tables>      Comma-separated list of tables to sync (apps,testimonials,all) [default: all]
  --dev-db-url <url>     Development database URL [default: DEV_DATABASE_URL or DATABASE_URL]
  --prod-db-url <url>    Production database URL [default: PROD_DATABASE_URL]
  --verbose              Show detailed changes in summary
  --help                 Show this help message

Business Keys:
  - Apps: name field
  - Testimonials: name + content hash

Safety Features:
  - Never touches purchases table
  - Creates backup before sync
  - Single atomic transaction for all tables
  - Preflight checks for business key duplicates
  - Safe upsert strategy (update by business key, insert if new)
  - Complete rollback on any error

Examples:
  tsx scripts/sync-db.ts --dry-run
  tsx scripts/sync-db.ts --replace --verbose
  tsx scripts/sync-db.ts --tables apps --dry-run
  tsx scripts/sync-db.ts --tables apps,testimonials --replace
  tsx scripts/sync-db.ts --dev-db-url "postgresql://..." --prod-db-url "postgresql://..."
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
  console.log('🚀 Starting database synchronization...\n');
  
  const options = parseArgs();
  validateTables(options.tables);
  
  await performSync(options);
}

// Run the script
if (import.meta.url === new URL('file://' + process.argv[1]).href) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}