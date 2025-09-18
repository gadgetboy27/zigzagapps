#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { apps, testimonials } from '../shared/schema.js';
import { eq, and, ne } from 'drizzle-orm';
import { createBackup } from './backup-db.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

interface CleanupOptions {
  dryRun: boolean;
  table: 'apps' | 'testimonials' | 'all';
  strategy: 'auto' | 'interactive';
  keepCriteria: 'newest' | 'oldest' | 'most-complete' | 'highest-id';
  databaseUrl?: string;
}

interface DuplicateGroup {
  name: string;
  records: any[];
  keeper?: any;
  toDelete: any[];
}

interface CleanupResult {
  table: string;
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  totalDeleted: number;
  backupFile?: string;
}

interface CleanupSummary {
  totalGroupsProcessed: number;
  totalRecordsDeleted: number;
  tableResults: CleanupResult[];
  hasErrors: boolean;
  errors: string[];
}

// Calculate completeness score for a record
function calculateCompletenessScore(record: any, table: 'apps' | 'testimonials'): number {
  let score = 0;
  let maxScore = 0;

  if (table === 'apps') {
    // Essential fields (weight: 2)
    const essentialFields = ['name', 'description', 'category'];
    essentialFields.forEach(field => {
      maxScore += 2;
      if (record[field] && record[field].toString().trim()) score += 2;
    });

    // Important fields (weight: 1.5)
    const importantFields = ['longDescription', 'price', 'imageUrl', 'demoUrl'];
    importantFields.forEach(field => {
      maxScore += 1.5;
      if (record[field] && record[field].toString().trim()) score += 1.5;
    });

    // Optional fields (weight: 1)
    const optionalFields = ['githubUrl', 'technologies', 'features'];
    optionalFields.forEach(field => {
      maxScore += 1;
      if (record[field]) {
        if (Array.isArray(record[field]) && record[field].length > 0) score += 1;
        else if (record[field] && record[field].toString().trim()) score += 1;
      }
    });
  } else {
    // Testimonials scoring
    const essentialFields = ['name', 'content'];
    essentialFields.forEach(field => {
      maxScore += 2;
      if (record[field] && record[field].toString().trim()) score += 2;
    });

    const importantFields = ['company', 'position', 'rating'];
    importantFields.forEach(field => {
      maxScore += 1.5;
      if (record[field] && record[field].toString().trim()) score += 1.5;
    });

    const optionalFields = ['avatarUrl'];
    optionalFields.forEach(field => {
      maxScore += 1;
      if (record[field] && record[field].toString().trim()) score += 1;
    });
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

// Select the best record from a group of duplicates
function selectBestRecord(records: any[], table: 'apps' | 'testimonials', strategy: string): any {
  if (records.length <= 1) return records[0];

  switch (strategy) {
    case 'newest':
      return records.reduce((best, current) => {
        const bestDate = new Date(best.createdAt || best.updatedAt || 0);
        const currentDate = new Date(current.createdAt || current.updatedAt || 0);
        return currentDate > bestDate ? current : best;
      });

    case 'oldest':
      return records.reduce((best, current) => {
        const bestDate = new Date(best.createdAt || best.updatedAt || Date.now());
        const currentDate = new Date(current.createdAt || current.updatedAt || Date.now());
        return currentDate < bestDate ? current : best;
      });

    case 'highest-id':
      return records.reduce((best, current) => {
        return current.id > best.id ? current : best;
      });

    case 'most-complete':
    default:
      // Calculate completeness scores and select the best
      const scored = records.map(record => ({
        record,
        completeness: calculateCompletenessScore(record, table),
        createdAt: new Date(record.createdAt || 0)
      }));

      // Sort by completeness (desc), then by creation date (desc) as tiebreaker
      scored.sort((a, b) => {
        if (a.completeness !== b.completeness) {
          return b.completeness - a.completeness;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      return scored[0].record;
  }
}

// Find duplicate groups in a table
async function findDuplicates(db: any, table: 'apps' | 'testimonials'): Promise<DuplicateGroup[]> {
  console.log(`🔍 Scanning ${table} table for duplicates...`);
  
  let allRecords: any[];
  
  if (table === 'apps') {
    allRecords = await db.select().from(apps).where(eq(apps.isActive, true));
  } else {
    allRecords = await db.select().from(testimonials).where(eq(testimonials.isActive, true));
  }

  console.log(`  📊 Found ${allRecords.length} active records`);

  // Group records by name (case-insensitive)
  const groupedByName = new Map<string, any[]>();
  
  allRecords.forEach(record => {
    const normalizedName = record.name.toLowerCase().trim();
    if (!groupedByName.has(normalizedName)) {
      groupedByName.set(normalizedName, []);
    }
    groupedByName.get(normalizedName)!.push(record);
  });

  // Filter to only groups with duplicates
  const duplicateGroups: DuplicateGroup[] = [];
  
  for (const [name, records] of groupedByName.entries()) {
    if (records.length > 1) {
      duplicateGroups.push({
        name: records[0].name, // Use original casing from first record
        records,
        toDelete: []
      });
    }
  }

  console.log(`  🔁 Found ${duplicateGroups.length} duplicate groups`);
  return duplicateGroups;
}

// Process duplicates for a single table
async function processDuplicatesForTable(
  db: any,
  table: 'apps' | 'testimonials',
  options: CleanupOptions
): Promise<CleanupResult> {
  console.log(`\n📋 Processing ${table.toUpperCase()} duplicates`);
  console.log('═'.repeat(50));

  const result: CleanupResult = {
    table,
    duplicateGroups: [],
    totalDuplicates: 0,
    totalDeleted: 0
  };

  try {
    // Find all duplicate groups
    const duplicateGroups = await findDuplicates(db, table);
    result.duplicateGroups = duplicateGroups;
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found!');
      return result;
    }

    // Process each duplicate group
    for (const group of duplicateGroups) {
      console.log(`\n🔁 Processing duplicate group: "${group.name}"`);
      console.log(`   📊 Found ${group.records.length} duplicates`);
      
      // Select the best record to keep
      group.keeper = selectBestRecord(group.records, table, options.keepCriteria);
      group.toDelete = group.records.filter(r => r.id !== group.keeper.id);
      
      console.log(`   ✅ Keeper: ID ${group.keeper.id} (${options.keepCriteria} strategy)`);
      console.log(`      📅 Created: ${group.keeper.createdAt}`);
      if (table === 'apps') {
        console.log(`      💰 Price: ${group.keeper.price || 'Not set'}`);
        console.log(`      📝 Description length: ${group.keeper.description?.length || 0} chars`);
        console.log(`      🖼️  Image: ${group.keeper.imageUrl ? 'Yes' : 'No'}`);
        console.log(`      🔗 Demo URL: ${group.keeper.demoUrl ? 'Yes' : 'No'}`);
        console.log(`      ⭐ Premium: ${group.keeper.isPremium ? 'Yes' : 'No'}`);
        console.log(`      📊 Completeness: ${calculateCompletenessScore(group.keeper, table).toFixed(1)}%`);
      } else {
        console.log(`      🏢 Company: ${group.keeper.company || 'Not set'}`);
        console.log(`      ⭐ Rating: ${group.keeper.rating || 'Not set'}`);
        console.log(`      📊 Completeness: ${calculateCompletenessScore(group.keeper, table).toFixed(1)}%`);
      }
      
      console.log(`   🗑️  To delete: ${group.toDelete.length} records`);
      group.toDelete.forEach(record => {
        console.log(`      - ID ${record.id} (created: ${record.createdAt}, completeness: ${calculateCompletenessScore(record, table).toFixed(1)}%)`);
      });

      result.totalDuplicates += group.records.length;
      result.totalDeleted += group.toDelete.length;
    }

    return result;

  } catch (error) {
    console.error(`❌ Error processing ${table} duplicates:`, error);
    throw error;
  }
}

// Execute deletions for a table
async function executeDeletions(
  tx: any,
  table: 'apps' | 'testimonials',
  duplicateGroups: DuplicateGroup[]
): Promise<number> {
  let totalDeleted = 0;

  for (const group of duplicateGroups) {
    for (const record of group.toDelete) {
      if (table === 'apps') {
        await tx.update(apps)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(apps.id, record.id));
      } else {
        await tx.update(testimonials)
          .set({ isActive: false })
          .where(eq(testimonials.id, record.id));
      }
      totalDeleted++;
    }
  }

  return totalDeleted;
}

// Main cleanup function
async function performCleanup(options: CleanupOptions): Promise<CleanupSummary> {
  const dbUrl = options.databaseUrl || process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('No database URL found. Please set PROD_DATABASE_URL or DATABASE_URL environment variable.');
  }

  console.log(`🔌 Connecting to database...`);
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle({ client: pool, schema: { apps, testimonials } });

  const summary: CleanupSummary = {
    totalGroupsProcessed: 0,
    totalRecordsDeleted: 0,
    tableResults: [],
    hasErrors: false,
    errors: []
  };

  try {
    console.log(`\n${options.dryRun ? '🧪 DRY RUN MODE' : '🚀 CLEANUP MODE'}`);
    console.log(`📋 Strategy: ${options.keepCriteria}`);
    console.log(`🎯 Table(s): ${options.table}`);
    
    if (options.dryRun) {
      console.log('📝 No changes will be made to the database');
    }

    // Determine which tables to process
    const tablesToProcess: ('apps' | 'testimonials')[] = [];
    if (options.table === 'all') {
      tablesToProcess.push('apps', 'testimonials');
    } else {
      tablesToProcess.push(options.table);
    }

    // Create backup before cleanup (only if not dry run)
    if (!options.dryRun) {
      console.log('\n💾 Creating backup before cleanup...');
      try {
        const backupResults = await createBackup({
          tables: tablesToProcess.length === 2 ? ['all'] : [tablesToProcess[0]],
          outputDir: './backups',
          databaseUrl: dbUrl
        });
        
        if (backupResults.length > 0) {
          console.log('✅ Backup created successfully');
          summary.tableResults.forEach((result, index) => {
            if (backupResults[index]) {
              result.backupFile = backupResults[index].file;
            }
          });
        }
      } catch (backupError) {
        console.error('❌ Backup failed:', backupError);
        throw new Error('Backup failed - aborting cleanup for safety');
      }
    }

    // Process each table
    for (const table of tablesToProcess) {
      try {
        const result = await processDuplicatesForTable(db, table, options);
        summary.tableResults.push(result);
        summary.totalGroupsProcessed += result.duplicateGroups.length;
      } catch (error) {
        summary.hasErrors = true;
        summary.errors.push(`Error processing ${table}: ${error}`);
        console.error(`❌ Error processing ${table}:`, error);
      }
    }

    // Execute deletions if not dry run
    if (!options.dryRun && summary.tableResults.some(r => r.totalDeleted > 0)) {
      console.log('\n⚡ Executing cleanup in atomic transaction...');
      
      await db.transaction(async (tx) => {
        for (const result of summary.tableResults) {
          if (result.duplicateGroups.length > 0) {
            const deleted = await executeDeletions(tx, result.table as 'apps' | 'testimonials', result.duplicateGroups);
            summary.totalRecordsDeleted += deleted;
            console.log(`  ✅ ${result.table}: ${deleted} records deactivated`);
          }
        }
      });
      
      console.log('✅ Transaction completed successfully');
    } else if (options.dryRun) {
      // Calculate what would be deleted
      summary.totalRecordsDeleted = summary.tableResults.reduce((total, result) => total + result.totalDeleted, 0);
    }

    return summary;

  } catch (error) {
    summary.hasErrors = true;
    summary.errors.push(`Fatal error: ${error}`);
    console.error('❌ Cleanup failed:', error);
    if (!options.dryRun) {
      console.error('🔄 All changes have been rolled back due to transaction failure');
    }
    throw error;
  }
}

// CLI argument parsing
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  const options: CleanupOptions = {
    dryRun: false,
    table: 'apps',
    strategy: 'auto',
    keepCriteria: 'most-complete',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--table':
        if (i + 1 < args.length) {
          const table = args[i + 1] as 'apps' | 'testimonials' | 'all';
          if (['apps', 'testimonials', 'all'].includes(table)) {
            options.table = table;
          } else {
            console.error(`❌ Invalid table: ${table}. Valid options: apps, testimonials, all`);
            process.exit(1);
          }
          i++;
        }
        break;
      case '--strategy':
        if (i + 1 < args.length) {
          const strategy = args[i + 1];
          if (['auto', 'interactive'].includes(strategy)) {
            options.strategy = strategy as 'auto' | 'interactive';
          } else {
            console.error(`❌ Invalid strategy: ${strategy}. Valid options: auto, interactive`);
            process.exit(1);
          }
          i++;
        }
        break;
      case '--keep':
        if (i + 1 < args.length) {
          const criteria = args[i + 1];
          if (['newest', 'oldest', 'most-complete', 'highest-id'].includes(criteria)) {
            options.keepCriteria = criteria as any;
          } else {
            console.error(`❌ Invalid keep criteria: ${criteria}. Valid options: newest, oldest, most-complete, highest-id`);
            process.exit(1);
          }
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
Database Duplicate Cleanup Tool

Usage: tsx scripts/cleanup-duplicates.ts [options]

URGENT: Fixes production database duplication issues like the 6 copies of "Harikoa Kainga"

Options:
  --dry-run              Show planned changes without executing them
  --table <table>        Table to clean (apps, testimonials, all) [default: apps]
  --strategy <strategy>  Cleanup strategy (auto, interactive) [default: auto]
  --keep <criteria>      Which record to keep (newest, oldest, most-complete, highest-id) [default: most-complete]
  --db-url <url>         Database URL [default: PROD_DATABASE_URL or DATABASE_URL]
  --help                 Show this help message

Keep Criteria:
  - newest: Keep the most recently created record
  - oldest: Keep the oldest record  
  - most-complete: Keep record with most complete data (recommended)
  - highest-id: Keep record with highest ID

Safety Features:
  - Creates backup before any deletions
  - Uses atomic transactions for all operations
  - Soft deletes (sets isActive=false) instead of hard deletes
  - Complete rollback on any error
  - Detailed reporting of what will be changed

Examples:
  tsx scripts/cleanup-duplicates.ts --dry-run
  tsx scripts/cleanup-duplicates.ts --table apps --keep newest
  tsx scripts/cleanup-duplicates.ts --table all --dry-run
  tsx scripts/cleanup-duplicates.ts --keep most-complete  # Fix Harikoa Kainga duplicates
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
async function main() {
  console.log('🚀 Starting duplicate cleanup...\n');
  
  const options = parseArgs();
  
  try {
    const summary = await performCleanup(options);
    
    // Print final summary
    console.log('\n📊 Cleanup Summary:');
    console.log('═'.repeat(60));
    
    summary.tableResults.forEach(result => {
      console.log(`\n📋 ${result.table.toUpperCase()}`);
      console.log(`  🔁 Duplicate groups found: ${result.duplicateGroups.length}`);
      console.log(`  📊 Total duplicates: ${result.totalDuplicates}`);
      console.log(`  🗑️  Records ${options.dryRun ? 'to be' : ''} deleted: ${result.totalDeleted}`);
      
      if (result.backupFile) {
        console.log(`  💾 Backup file: ${result.backupFile}`);
      }
    });

    console.log(`\n🎯 OVERALL TOTALS:`);
    console.log(`  🔁 Groups processed: ${summary.totalGroupsProcessed}`);
    console.log(`  🗑️  Records ${options.dryRun ? 'to be' : ''} deleted: ${summary.totalRecordsDeleted}`);

    if (summary.hasErrors) {
      console.log(`\n⚠️  ERRORS ENCOUNTERED:`);
      summary.errors.forEach(error => console.log(`  ❌ ${error}`));
    }

    if (options.dryRun) {
      console.log('\n💡 Run without --dry-run to apply these changes');
      console.log('💡 Add --table all to clean both apps and testimonials');
    } else {
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('🌐 The duplicates on your website should now be resolved');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === new URL('file://' + process.argv[1]).href) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}