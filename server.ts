import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Shipment, ActivityLog, RegisteredUser } from './src/types';
import { initialShipments, initialActivityLogs } from './src/data';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let parse base64 company logos up to 15MB securely
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // Firebase Setup from local config
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found. Please run set_up_firebase first.');
  }
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

  // Hardcoded default users representing BSL staff list
  const defaultUsers: RegisteredUser[] = [
    { id: 'usr-1', email: 'director@bsl.co.id', fullName: 'Director Imron Syahputra', role: 'Director', password: 'director123', createdAt: '2026-05-27' },
    { id: 'usr-2', email: 'staff.ops@bsl.co.id', fullName: 'Robby Hermawan (Ops)', role: 'Staff', password: 'staff123', createdAt: '2026-05-27' },
    { id: 'usr-3', email: 'president@bsl.co.id', fullName: 'President Admiral Harry', role: 'President Director', password: 'president123', createdAt: '2026-05-27' },
    { id: 'usr-4', email: 'ops.dir@bsl.co.id', fullName: 'Director H. Subandono', role: 'Director of Operation', password: 'opsdirector123', createdAt: '2026-05-27' },
    { id: 'usr-5', email: 'fin.dir@bsl.co.id', fullName: 'Director Sri Mulyani Indrawati', role: 'Director of Finance', password: 'findirector123', createdAt: '2026-05-27' },
    { id: 'usr-6', email: 'finance.staff@bsl.co.id', fullName: 'Amelia Putri (Finance)', role: 'Finance Staff', password: 'finance123', createdAt: '2026-05-27' },
    { id: 'usr-7', email: 'operation.staff@bsl.co.id', fullName: 'Robby Hermawan (Ops Team)', role: 'Operation Staff', password: 'operation123', createdAt: '2026-05-27' }
  ];

  // Keep state in memory as single-source of truth and sync to Firestore
  let shipments: Shipment[] = [];
  let activityLogs: ActivityLog[] = [];
  let registeredUsers: RegisteredUser[] = [];
  let companyLogo: string | null = null;
  let version = Date.now();

  const loadAllFromFirestore = async () => {
    console.log('Loading state from Firestore database...');
    try {
      // Check if setup/seed has been completed before
      const setupSnap = await getDoc(doc(db, 'brandConfig', 'setup'));
      const isFirstSetup = !setupSnap.exists();

      if (isFirstSetup) {
        console.log('Performing first-time database seed...');
        await setDoc(doc(db, 'brandConfig', 'setup'), {
          initialized: true,
          seededAt: new Date().toISOString()
        });
      }

      // 1. Load Shipments
      const shipmentsSnapshot = await getDocs(collection(db, 'shipments'));
      if (shipmentsSnapshot.empty && isFirstSetup) {
        console.log('Firestore shipments empty. Initializing default dataset...');
        shipments = [...initialShipments];
        for (const s of shipments) {
          await setDoc(doc(db, 'shipments', s.id), s);
        }
      } else {
        const fetched: Shipment[] = [];
        const seenJobNos = new Set<string>();
        const duplicatesToDelete: string[] = [];
        const rawItems: { id: string; data: Shipment }[] = [];

        shipmentsSnapshot.forEach(docSnap => {
          rawItems.push({ id: docSnap.id, data: docSnap.data() as Shipment });
        });

        // Order rawItems by updatedAt descending (newest updated first)
        rawItems.sort((a, b) => {
          const dateA = a.data.updatedAt || a.data.createdAt || '';
          const dateB = b.data.updatedAt || b.data.createdAt || '';
          return dateB.localeCompare(dateA);
        });

        for (const item of rawItems) {
          const normJobNo = (item.data.jobNo || '').trim().toUpperCase();
          if (!normJobNo) {
            fetched.push(item.data);
            continue;
          }
          if (seenJobNos.has(normJobNo)) {
            duplicatesToDelete.push(item.id);
            console.log(`[DEDUPLICATOR] Found duplicate shipment in Firestore for JobNo "${normJobNo}" with ID "${item.id}". Deleting...`);
          } else {
            seenJobNos.add(normJobNo);
            fetched.push(item.data);
          }
        }

        // Asynchronously clean up duplicates in Firestore so the DB stays clean and tidy
        for (const dupId of duplicatesToDelete) {
          deleteDoc(doc(db, 'shipments', dupId)).catch(err => {
            console.error(`[DEDUPLICATOR] Failed to delete duplicate doc ${dupId} from Firestore:`, err);
          });
        }

        fetched.sort((a, b) => b.id.localeCompare(a.id));
        shipments = fetched;
      }

      // 2. Load Activity Logs
      const logsSnapshot = await getDocs(collection(db, 'activityLogs'));
      if (logsSnapshot.empty && isFirstSetup) {
        console.log('Firestore logs empty. Initializing default dataset...');
        activityLogs = [...initialActivityLogs];
        for (const log of activityLogs) {
          await setDoc(doc(db, 'activityLogs', log.id), log);
        }
      } else {
        const fetched: ActivityLog[] = [];
        logsSnapshot.forEach(docSnap => {
          fetched.push(docSnap.data() as ActivityLog);
        });
        fetched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        activityLogs = fetched;
      }

      // 3. Load Registered Users
      const usersSnapshot = await getDocs(collection(db, 'registeredUsers'));
      if (usersSnapshot.empty && isFirstSetup) {
        console.log('Firestore registered users empty. Initializing default dataset...');
        registeredUsers = [...defaultUsers];
        for (const u of registeredUsers) {
          await setDoc(doc(db, 'registeredUsers', u.id), u);
        }
      } else {
        const fetched: RegisteredUser[] = [];
        usersSnapshot.forEach(docSnap => {
          fetched.push(docSnap.data() as RegisteredUser);
        });
        registeredUsers = fetched;
      }

      // 4. Load Company Logo
      const logoSnap = await getDoc(doc(db, 'brandConfig', 'logo'));
      if (logoSnap.exists()) {
        companyLogo = logoSnap.data().logo || null;
      } else {
        companyLogo = null;
      }
      console.log('Firestore sync successfully completed.');
    } catch (err) {
      console.error('Error getting documents from Firestore:', err);
    }
  };

  // Run initial Firestore sync on boot
  await loadAllFromFirestore();

  // Register Real-Time Firestore listeners on the server to keep all instances synchronized!
  console.log('Registering real-time Firestore listeners on server...');
  
  // 1. Listen to shipments
  onSnapshot(collection(db, 'shipments'), (snapshot) => {
    const fetched: Shipment[] = [];
    const seenJobNos = new Set<string>();
    const duplicatesToDelete: string[] = [];
    const rawItems: { id: string; data: Shipment }[] = [];

    snapshot.forEach(docSnap => {
      rawItems.push({ id: docSnap.id, data: docSnap.data() as Shipment });
    });

    // Order rawItems by updatedAt descending (newest updated first)
    rawItems.sort((a, b) => {
      const dateA = a.data.updatedAt || a.data.createdAt || '';
      const dateB = b.data.updatedAt || b.data.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    for (const item of rawItems) {
      const normJobNo = (item.data.jobNo || '').trim().toUpperCase();
      if (!normJobNo) {
        fetched.push(item.data);
        continue;
      }
      if (seenJobNos.has(normJobNo)) {
        duplicatesToDelete.push(item.id);
      } else {
        seenJobNos.add(normJobNo);
        fetched.push(item.data);
      }
    }

    // Clean up duplicates if any
    for (const dupId of duplicatesToDelete) {
      deleteDoc(doc(db, 'shipments', dupId)).catch(err => {
        console.error(`[DEDUPLICATOR] Listener failed to delete duplicate ${dupId}:`, err);
      });
    }

    fetched.sort((a, b) => b.id.localeCompare(a.id));
    
    // Compare if different to avoid infinite trigger/version noise
    const stringifiedPrev = JSON.stringify(shipments.map(s => s.id + (s.updatedAt || s.createdAt || '')));
    const stringifiedNew = JSON.stringify(fetched.map(s => s.id + (s.updatedAt || s.createdAt || '')));
    if (stringifiedPrev !== stringifiedNew) {
      shipments = fetched;
      version = Date.now();
      console.log(`[REAL-TIME SYNC] Shipments updated in Firestore. New version: ${version}`);
    }
  }, (err) => {
    console.error('Firestore shipments listener error:', err);
  });

  // 2. Listen to activityLogs
  onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
    const fetched: ActivityLog[] = [];
    snapshot.forEach(docSnap => {
      fetched.push(docSnap.data() as ActivityLog);
    });
    fetched.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    if (activityLogs.length !== fetched.length) {
      activityLogs = fetched;
      version = Date.now();
      console.log(`[REAL-TIME SYNC] Activity logs updated in Firestore. New version: ${version}`);
    }
  }, (err) => {
    console.error('Firestore activityLogs listener error:', err);
  });

  // 3. Listen to registeredUsers
  onSnapshot(collection(db, 'registeredUsers'), (snapshot) => {
    const fetched: RegisteredUser[] = [];
    snapshot.forEach(docSnap => {
      fetched.push(docSnap.data() as RegisteredUser);
    });
    
    const stringifiedPrev = JSON.stringify(registeredUsers.map(u => u.id + u.role));
    const stringifiedNew = JSON.stringify(fetched.map(u => u.id + u.role));
    if (stringifiedPrev !== stringifiedNew) {
      registeredUsers = fetched;
      version = Date.now();
      console.log(`[REAL-TIME SYNC] Registered users updated in Firestore. New version: ${version}`);
    }
  }, (err) => {
    console.error('Firestore registeredUsers listener error:', err);
  });

  // 4. Listen to brandConfig logo selection
  onSnapshot(collection(db, 'brandConfig'), (snapshot) => {
    snapshot.forEach(docSnap => {
      if (docSnap.id === 'logo') {
        const logo = docSnap.data().logo || null;
        if (companyLogo !== logo) {
          companyLogo = logo;
          version = Date.now();
          console.log(`[REAL-TIME SYNC] Company logo updated in Firestore. New version: ${version}`);
        }
      }
    });
  }, (err) => {
    console.error('Firestore brandConfig listener error:', err);
  });

  // API Endpoints
  // 1. Get entire synced state
  app.get('/api/state', (req, res) => {
    res.json({
      shipments,
      activityLogs,
      registeredUsers,
      companyLogo,
      version
    });
  });

  // 1b. Fast lightweight check of current version
  app.get('/api/version', (req, res) => {
    res.json({ version });
  });

  // 2. Sync all catch-all
  app.post('/api/state/sync-all', async (req, res) => {
    try {
      const { clientShipments, clientLogs, clientUsers, clientLogo } = req.body;
      if (clientShipments) {
        shipments = clientShipments;
        for (const s of shipments) {
          await setDoc(doc(db, 'shipments', s.id), s);
        }
      }
      if (clientLogs) {
        activityLogs = clientLogs;
        for (const log of activityLogs) {
          await setDoc(doc(db, 'activityLogs', log.id), log);
        }
      }
      if (clientUsers) {
        registeredUsers = clientUsers;
        for (const u of registeredUsers) {
          await setDoc(doc(db, 'registeredUsers', u.id), u);
        }
      }
      if (clientLogo !== undefined) {
        companyLogo = clientLogo;
        await setDoc(doc(db, 'brandConfig', 'logo'), { logo: companyLogo });
      }
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error in sync-all API:', err);
      res.status(500).json({ error: 'Failed to sync with Firestore' });
    }
  });

  // 2b. Wipe shipments endpoint
  app.post('/api/state/wipe-shipments', async (req, res) => {
    try {
      console.log('Initiating wipe of all shipments...');
      // 1. Delete all shipments in firestore
      const shipmentsSnapshot = await getDocs(collection(db, 'shipments'));
      for (const docSnap of shipmentsSnapshot.docs) {
        await deleteDoc(doc(db, 'shipments', docSnap.id));
      }
      
      // 2. Clear shipments memory list
      shipments = [];
      version = Date.now();
      
      // 3. Document this wipe in Activity Log
      const rawUser = req.body?.user || {};
      const newLog: ActivityLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        shipmentId: 'SYSTEM',
        jobNo: 'WIPE-ALL',
        username: rawUser.username || 'Admin',
        role: rawUser.role || 'Director of Operation',
        action: 'Wiped all operational shipment records from active database.',
        timestamp: new Date().toISOString()
      };
      activityLogs = [newLog, ...activityLogs];
      await setDoc(doc(db, 'activityLogs', newLog.id), newLog);

      console.log('Successfully wiped all shipments from Firestore database.');
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error wiping shipments:', err);
      res.status(500).json({ error: 'Failed to wipe shipments from database' });
    }
  });

  // 3. Specific shipment actions
  app.post('/api/shipments', async (req, res) => {
    try {
      const rawShipment = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Enforce unique Job Number check at server level to block duplicate creations
      const normJobNo = (rawShipment.jobNo || '').trim().toUpperCase();
      if (normJobNo) {
        const isDuplicate = shipments.some(s => (s.jobNo || '').trim().toUpperCase() === normJobNo);
        if (isDuplicate) {
          console.warn(`[DUPLICATE BLOCKED] Prevented shipment register attempt for duplicate JobNo: "${rawShipment.jobNo}"`);
          return res.status(400).json({ 
            error: `Gagal menyimpan: Job Number "${rawShipment.jobNo}" sudah ada di sistem dan tidak boleh duplikat!` 
          });
        }
      }

      // Find maximum numeric sequence to calculate the next ID without collision (e.g. BSL-2026-0004)
      let maxSeq = 0;
      for (const s of shipments) {
        if (s.id && s.id.startsWith('BSL-2026-')) {
          const numPart = parseInt(s.id.replace('BSL-2026-', ''), 10);
          if (!isNaN(numPart) && numPart > maxSeq) {
            maxSeq = numPart;
          }
        }
      }
      const nextSeq = maxSeq + 1;
      const newId = `BSL-2026-${nextSeq.toString().padStart(4, '0')}`;

      const newShipment: Shipment = {
        ...rawShipment,
        id: newId,
        createdAt: today,
        updatedAt: today
      };

      shipments = [newShipment, ...shipments];
      await setDoc(doc(db, 'shipments', newId), newShipment);
      version = Date.now();
      res.json({ success: true, shipment: newShipment, version });
    } catch (err) {
      console.error('Error adding shipment:', err);
      res.status(500).json({ error: 'Failed to write shipment to database' });
    }
  });

  app.put('/api/shipments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const rawShipment = req.body;
      const today = new Date().toISOString().split('T')[0];

      const updatedShipment: Shipment = {
        ...rawShipment,
        id,
        updatedAt: today
      };

      shipments = shipments.map(item => item.id === id ? updatedShipment : item);
      await setDoc(doc(db, 'shipments', id), updatedShipment);
      version = Date.now();
      res.json({ success: true, shipment: updatedShipment, version });
    } catch (err) {
      console.error('Error updating shipment:', err);
      res.status(500).json({ error: 'Failed to update shipment in database' });
    }
  });

  app.delete('/api/shipments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      shipments = shipments.filter(item => item.id !== id);
      await deleteDoc(doc(db, 'shipments', id));
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error deleting shipment:', err);
      res.status(500).json({ error: 'Failed to delete shipment from database' });
    }
  });

  app.post('/api/shipments/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      let targetShipment: Shipment | null = null;
      shipments = shipments.map(item => {
        if (item.id === id) {
          targetShipment = { ...item, isApproved: true, cashFlowStatus: 'Funded (Active)' };
          return targetShipment;
        }
        return item;
      });
      if (targetShipment) {
        await setDoc(doc(db, 'shipments', id), targetShipment);
      }
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error approving shipment:', err);
      res.status(500).json({ error: 'Failed to approve shipment' });
    }
  });

  // 4. Logs
  app.post('/api/logs', async (req, res) => {
    try {
      const newLog: ActivityLog = req.body;
      activityLogs = [newLog, ...activityLogs];
      await setDoc(doc(db, 'activityLogs', newLog.id), newLog);
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error saving log to Firestore:', err);
      res.status(500).json({ error: 'Failed to save log to database' });
    }
  });

  // 5. Users
  app.post('/api/users', async (req, res) => {
    try {
      const userPayload: RegisteredUser = req.body;
      const existingIdx = registeredUsers.findIndex(u => u.id === userPayload.id);
      if (existingIdx !== -1) {
        registeredUsers[existingIdx] = userPayload;
      } else {
        registeredUsers.push(userPayload);
      }
      await setDoc(doc(db, 'registeredUsers', userPayload.id), userPayload);
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error saving user:', err);
      res.status(500).json({ error: 'Failed to register/update user' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      registeredUsers = registeredUsers.filter(u => u.id !== id);
      await deleteDoc(doc(db, 'registeredUsers', id));
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // 6. Company Logo
  app.post('/api/logo', async (req, res) => {
    try {
      const { logo } = req.body;
      companyLogo = logo;
      await setDoc(doc(db, 'brandConfig', 'logo'), { logo });
      version = Date.now();
      res.json({ success: true, version });
    } catch (err) {
      console.error('Error saving logo:', err);
      res.status(500).json({ error: 'Failed to update company logo' });
    }
  });

  // Serve Vite or static assets depending on NODE_ENV
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BSL Real-Time Sync Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start BSL sync server:', err);
});
