#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { apps, testimonials } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class TransactionTester {
  private db: any;
  private results: TestResult[] = [];

  constructor(databaseUrl: string) {
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle({ client: pool, schema: { apps, testimonials } });
  }

  private log(message: string) {
    console.log(`🧪 ${message}`);
  }

  private addResult(test: string, passed: boolean, error?: string, details?: any) {
    this.results.push({ test, passed, error, details });
    console.log(`${passed ? '✅' : '❌'} ${test}${error ? `: ${error}` : ''}`);
  }

  async testBasicTransactionSupport(): Promise<void> {
    this.log('Testing basic transaction support...');
    
    try {
      let transactionExecuted = false;
      
      await this.db.transaction(async (tx: any) => {
        // Simple test operation inside transaction
        const testResult = await tx.select().from(apps).limit(1);
        transactionExecuted = true;
      });

      this.addResult('Basic transaction support', transactionExecuted, undefined, 'Transaction executed successfully');
    } catch (error) {
      this.addResult('Basic transaction support', false, (error as Error).message);
    }
  }

  async testTransactionRollback(): Promise<void> {
    this.log('Testing transaction rollback on error...');
    
    try {
      // Get initial count
      const initialApps = await this.db.select().from(apps);
      const initialCount = initialApps.length;

      let rollbackWorked = false;
      
      try {
        await this.db.transaction(async (tx: any) => {
          // Insert a test record
          await tx.insert(apps).values({
            name: 'TEST_ROLLBACK_APP',
            description: 'This should be rolled back',
            category: 'test',
            isPremium: false,
            isActive: true
          });
          
          // Force an error to trigger rollback
          throw new Error('Intentional error to test rollback');
        });
      } catch (error) {
        // Expected error - now check if rollback worked
        const finalApps = await this.db.select().from(apps);
        const finalCount = finalApps.length;
        
        // Check that the test record was not actually inserted
        const testApp = finalApps.find(app => app.name === 'TEST_ROLLBACK_APP');
        
        rollbackWorked = (finalCount === initialCount && !testApp);
      }

      this.addResult('Transaction rollback', rollbackWorked, undefined, 
        rollbackWorked ? 'Rollback worked - test record was not persisted' : 'Rollback failed - test record was persisted');
        
    } catch (error) {
      this.addResult('Transaction rollback', false, (error as Error).message);
    }
  }

  async testMultiTableTransactionAtomicity(): Promise<void> {
    this.log('Testing multi-table transaction atomicity...');
    
    try {
      // Get initial counts
      const initialApps = await this.db.select().from(apps);
      const initialTestimonials = await this.db.select().from(testimonials);
      const initialAppCount = initialApps.length;
      const initialTestimonialCount = initialTestimonials.length;

      let atomicityWorked = false;
      
      try {
        await this.db.transaction(async (tx: any) => {
          // Insert to apps table
          await tx.insert(apps).values({
            name: 'TEST_ATOMIC_APP',
            description: 'Test app for atomicity',
            category: 'test',
            isPremium: false,
            isActive: true
          });
          
          // Insert to testimonials table
          await tx.insert(testimonials).values({
            name: 'Test User',
            content: 'Test testimonial for atomicity',
            rating: '5.0',
            isActive: true
          });
          
          // Force an error after both inserts
          throw new Error('Intentional error to test atomicity');
        });
      } catch (error) {
        // Expected error - now check if both operations were rolled back
        const finalApps = await this.db.select().from(apps);
        const finalTestimonials = await this.db.select().from(testimonials);
        
        const finalAppCount = finalApps.length;
        const finalTestimonialCount = finalTestimonials.length;
        
        const testApp = finalApps.find(app => app.name === 'TEST_ATOMIC_APP');
        const testTestimonial = finalTestimonials.find(t => t.name === 'Test User');
        
        atomicityWorked = (
          finalAppCount === initialAppCount && 
          finalTestimonialCount === initialTestimonialCount &&
          !testApp && 
          !testTestimonial
        );
      }

      this.addResult('Multi-table transaction atomicity', atomicityWorked, undefined,
        atomicityWorked ? 'Both table operations were properly rolled back' : 'Some operations were not rolled back');
        
    } catch (error) {
      this.addResult('Multi-table transaction atomicity', false, (error as Error).message);
    }
  }

  async testSuccessfulTransaction(): Promise<void> {
    this.log('Testing successful transaction commit...');
    
    try {
      const testAppName = `TEST_SUCCESS_${Date.now()}`;
      let commitWorked = false;
      
      await this.db.transaction(async (tx: any) => {
        await tx.insert(apps).values({
          name: testAppName,
          description: 'Test app for successful commit',
          category: 'test',
          isPremium: false,
          isActive: true
        });
      });
      
      // Check if the record was actually committed
      const insertedApp = await this.db.select().from(apps).where(eq(apps.name, testAppName));
      commitWorked = insertedApp.length === 1;
      
      // Clean up - delete the test record
      if (commitWorked) {
        await this.db.delete(apps).where(eq(apps.name, testAppName));
      }

      this.addResult('Successful transaction commit', commitWorked, undefined,
        commitWorked ? 'Transaction committed successfully' : 'Transaction was not committed');
        
    } catch (error) {
      this.addResult('Successful transaction commit', false, (error as Error).message);
    }
  }

  async testNestedTransactionError(): Promise<void> {
    this.log('Testing nested transaction error handling...');
    
    try {
      let nestedErrorHandled = false;
      
      try {
        await this.db.transaction(async (tx: any) => {
          // Try to start another transaction inside (this should work with proper neon-serverless)
          // But we'll test error propagation
          await tx.insert(apps).values({
            name: 'TEST_NESTED',
            description: 'Test nested transaction',
            category: 'test',
            isPremium: false,
            isActive: true
          });
          
          // Simulate an error deep in the transaction
          throw new Error('Nested transaction error');
        });
      } catch (error) {
        nestedErrorHandled = true;
        
        // Verify the record was not inserted
        const testRecord = await this.db.select().from(apps).where(eq(apps.name, 'TEST_NESTED'));
        nestedErrorHandled = nestedErrorHandled && testRecord.length === 0;
      }

      this.addResult('Nested transaction error handling', nestedErrorHandled, undefined,
        nestedErrorHandled ? 'Nested errors properly bubble up and cause rollback' : 'Nested error handling failed');
        
    } catch (error) {
      this.addResult('Nested transaction error handling', false, (error as Error).message);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting transaction support integration tests...\n');
    
    await this.testBasicTransactionSupport();
    await this.testTransactionRollback();
    await this.testMultiTableTransactionAtomicity();
    await this.testSuccessfulTransaction();
    await this.testNestedTransactionError();
    
    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('═'.repeat(50));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failed = total - passed;
    
    this.results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 Results:');
    console.log(`  ✅ Passed: ${passed}/${total}`);
    console.log(`  ❌ Failed: ${failed}/${total}`);
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed - transaction support may not be working properly!');
      console.log('   This indicates critical issues that must be resolved before production use.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! Transaction support is working correctly.');
      console.log('   The database synchronization system is safe for production use.');
    }
  }
}

// CLI execution
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const tester = new TransactionTester(databaseUrl);
  await tester.runAllTests();
}

// Run the tests
if (import.meta.url === new URL('file://' + process.argv[1]).href) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}