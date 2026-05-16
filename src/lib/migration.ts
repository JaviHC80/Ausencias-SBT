import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db as newDb } from './firebase';

const oldFirebaseConfig = {
  apiKey: "AIzaSyAfZ4pki7SGDfAUstcRYKwp8FL2tFqa-3s",
  authDomain: "ausencias-e5b4c.firebaseapp.com",
  projectId: "ausencias-e5b4c",
  storageBucket: "ausencias-e5b4c.firebasestorage.app",
  messagingSenderId: "416450951783",
  appId: "1:416450951783:web:783d5b28f9b47b91d9b2c2"
};

export async function migrateHistory() {
  // Initialize old app
  const oldApp = initializeApp(oldFirebaseConfig, 'old-app');
  const oldDb = getFirestore(oldApp);
  
  try {
    const querySnapshot = await getDocs(collection(oldDb, 'ausencias'));
    console.log(`Found ${querySnapshot.size} records to migrate.`);
    
    let count = 0;
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      // Normalize worker name to Fabi (it was Fabiola in old app)
      let userName = data.worker;
      if (userName === 'Fabiola') userName = 'Fabi';
      
      // Construct new document
      const newAbsence = {
        userId: userName.toLowerCase(),
        userName: userName,
        startDate: Timestamp.fromDate(new Date(data.dateFrom + 'T12:00:00')),
        endDate: Timestamp.fromDate(new Date(data.dateTo + 'T12:00:00')),
        type: data.tipo ? data.tipo.toLowerCase() : 'completa',
        reason: data.motivo,
        createdAt: Timestamp.fromMillis(data.id || Date.now())
      };
      
      await addDoc(collection(newDb, 'absences'), newAbsence);
      count++;
    }
    
    console.log(`Successfully migrated ${count} records.`);
    return count;
  } finally {
    await deleteApp(oldApp);
  }
}
