import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '../components/ui/firebase';
import { collection, doc, setDoc, getDocs, Timestamp } from 'firebase/firestore';

export default function AdminRestore() {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setOutput(prev => prev + message + '\n');
    console.log(message);
  };

  // STEP 1: Verify Competition Settings
  const step1_verifyCompetition = async () => {
    setOutput('');
    setLoading(true);
    log('=== STEP 1: Verify Competition Settings ===\n');
    
    try {
      const snapshot = await getDocs(collection(db, 'competitionSettings'));
      log(`Found ${snapshot.size} competition settings`);
      
      if (snapshot.size > 0) {
        snapshot.forEach(doc => {
          const data = doc.data();
          log(`✅ Competition: ${data.name}`);
          log(`   Date: ${data.date}`);
          log(`   Registration Deadline: ${data.registrationDeadline}`);
          log(`   Active: ${data.isActive}`);
          log(`   Registration Open: ${data.registrationOpen}`);
        });
        log('\n✅ STEP 1 COMPLETE - Competition settings exist');
      } else {
        log('❌ No competition settings found');
        log('   Go to /scholarship page to auto-create');
      }
    } catch (error: any) {
      log('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Restore User Roles
  const step2_restoreUsers = async () => {
    setOutput('');
    setLoading(true);
    log('=== STEP 2: Restore User Roles ===\n');
    
    try {
      // Restore admin user (you)
      const adminUserId = 'tWGgvEZ7yDhpWsveTUvp78OxQdI2';
      await setDoc(doc(db, 'users', adminUserId), {
        email: 'mohapatra.shyam@gmail.com',
        displayName: 'Shyam Mohapatra',
        role: 'super_admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      log('✅ Restored admin user: mohapatra.shyam@gmail.com');
      
      // Note: Lucy's user ID will be created when she signs in
      log('\n✅ STEP 2 COMPLETE - Admin role restored');
      log('   Other users will be created when they sign in');
    } catch (error: any) {
      log('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Restore Lucy's Registration (if we have her user ID)
  const step3_restoreLucy = async () => {
    setOutput('');
    setLoading(true);
    log('=== STEP 3: Restore Test Registration ===\n');
    
    try {
      log('⚠️  Lucy needs to sign in first to get her user ID');
      log('   Then we can restore her registration');
      log('\n   Steps:');
      log('   1. Have Lucy sign in at /scholarship');
      log('   2. Check browser console for her user ID');
      log('   3. Come back here to restore her registration');
    } catch (error: any) {
      log('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: Check Quiz Templates
  const step4_checkQuizTemplates = async () => {
    setOutput('');
    setLoading(true);
    log('=== STEP 4: Check Quiz Templates ===\n');
    
    try {
      const snapshot = await getDocs(collection(db, 'quizTemplates'));
      log(`Found ${snapshot.size} quiz templates`);
      
      if (snapshot.size === 0) {
        log('\n❌ No quiz templates found');
        log('   Need to regenerate questions using API');
        log('   Go to Home page and use "Generate Quiz" feature');
      } else {
        snapshot.forEach(doc => {
          const data = doc.data();
          log(`✅ Template: ${data.title}`);
          log(`   Questions: ${data.questions?.length || 0}`);
        });
      }
    } catch (error: any) {
      log('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 5: Check Competitions
  const step5_checkCompetitions = async () => {
    setOutput('');
    setLoading(true);
    log('=== STEP 5: Check Competitions ===\n');
    
    try {
      const snapshot = await getDocs(collection(db, 'competitions'));
      log(`Found ${snapshot.size} competitions`);
      
      if (snapshot.size === 0) {
        log('\n❌ No competitions found');
        log('   Go to /admin/competitions to create new ones');
      } else {
        snapshot.forEach(doc => {
          const data = doc.data();
          log(`✅ Competition: ${data.title}`);
          log(`   Status: ${data.status}`);
        });
      }
    } catch (error: any) {
      log('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Restoration Tool</CardTitle>
          <p className="text-sm text-gray-600">
            Restore data step by step after accidental deletion
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ What Happened</h3>
            <p className="text-yellow-800 text-sm">
              Database collections were accidentally deleted. This tool helps restore functionality step by step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button onClick={step1_verifyCompetition} disabled={loading} variant="outline">
              Step 1: Verify Competition
            </Button>
            <Button onClick={step2_restoreUsers} disabled={loading} variant="outline">
              Step 2: Restore User Roles
            </Button>
            <Button onClick={step3_restoreLucy} disabled={loading} variant="outline">
              Step 3: Restore Registrations
            </Button>
            <Button onClick={step4_checkQuizTemplates} disabled={loading} variant="outline">
              Step 4: Check Quiz Templates
            </Button>
            <Button onClick={step5_checkCompetitions} disabled={loading} variant="outline">
              Step 5: Check Competitions
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing...</p>
            </div>
          )}

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre>{output || 'Click a step button to begin restoration...'}</pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Restoration Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Verify competition settings exist (auto-created)</li>
              <li>Restore admin user role</li>
              <li>Have test users sign in to recreate profiles</li>
              <li>Regenerate quiz questions using API</li>
              <li>Recreate competitions as needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
