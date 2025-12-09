import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeCompetitionSettings } from '../utils/initCompetition';
import { getActiveCompetitionSettings, getAllCompetitionSettings } from '../components/ui/firebase';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../components/ui/firebase';

export default function AdminDebugCompetition() {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    setOutput(prev => prev + message + '\n');
    console.log(message);
  };

  const testInitialize = async () => {
    setOutput('');
    setLoading(true);
    log('🚀 Testing initialization...');
    
    try {
      const result = await initializeCompetitionSettings();
      log('✅ Success!');
      log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      log('❌ Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testFetch = async () => {
    setOutput('');
    setLoading(true);
    log('🔍 Fetching competition settings...');
    
    try {
      const active = await getActiveCompetitionSettings();
      const all = await getAllCompetitionSettings();
      
      log(`📊 Active competition: ${active ? 'Found' : 'None'}`);
      log(`📊 Total settings: ${all.length}`);
      log('\n--- Active Competition ---');
      log(JSON.stringify(active, null, 2));
      log('\n--- All Competitions ---');
      log(JSON.stringify(all, null, 2));
    } catch (error: any) {
      log('❌ Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL competition settings?')) {
      return;
    }
    
    setOutput('');
    setLoading(true);
    log('🗑️ Clearing all competition settings...');
    
    try {
      const settingsRef = collection(db, 'competitionSettings');
      const snapshot = await getDocs(settingsRef);
      
      log(`Found ${snapshot.size} settings to delete`);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        log(`✅ Deleted: ${doc.id}`);
      }
      
      log('✅ All settings cleared!');
    } catch (error: any) {
      log('❌ Error: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkFirestoreRules = async () => {
    setOutput('');
    setLoading(true);
    log('🔐 Testing Firestore permissions...');
    
    try {
      // Try to read
      log('Testing READ permission...');
      const settingsRef = collection(db, 'competitionSettings');
      const snapshot = await getDocs(settingsRef);
      log(`✅ READ successful - found ${snapshot.size} documents`);
      
      // Try to write (via initialization)
      log('\nTesting WRITE permission...');
      await initializeCompetitionSettings();
      log('✅ WRITE successful');
      
    } catch (error: any) {
      log('❌ Permission error: ' + error.message);
      if (error.code === 'permission-denied') {
        log('\n⚠️ Firestore rules may be blocking access');
        log('Check firestore.rules file');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Competition Settings Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testInitialize} disabled={loading}>
              Initialize Settings
            </Button>
            <Button onClick={testFetch} disabled={loading} variant="outline">
              Fetch Settings
            </Button>
            <Button onClick={checkFirestoreRules} disabled={loading} variant="outline">
              Check Permissions
            </Button>
            <Button onClick={clearAll} disabled={loading} variant="destructive">
              Clear All Settings
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Processing...</p>
            </div>
          )}

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre>{output || 'Click a button to start testing...'}</pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li><strong>Initialize Settings:</strong> Creates default competition if none exists</li>
              <li><strong>Fetch Settings:</strong> Shows current active and all competition settings</li>
              <li><strong>Check Permissions:</strong> Tests if Firestore rules allow read/write</li>
              <li><strong>Clear All Settings:</strong> Deletes all competition settings (use with caution!)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
