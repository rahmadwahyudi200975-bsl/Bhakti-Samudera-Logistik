import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Shipment, ActivityLog, RegisteredUser } from './src/types';
import { initialShipments, initialActivityLogs } from './src/data';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let parse base64 company logos up to 15MB securely
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // Persistence Setup
  const DATA_DIR = path.join(process.cwd(), 'server-data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const PATH_SHIPMENTS = path.join(DATA_DIR, 'shipments.json');
  const PATH_LOGS = path.join(DATA_DIR, 'activity_logs.json');
  const PATH_USERS = path.join(DATA_DIR, 'registered_users.json');
  const PATH_LOGO = path.join(DATA_DIR, 'company_logo.json');

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

  // Helper load state from files, with fallbacks
  const loadShipments = (): Shipment[] => {
    if (fs.existsSync(PATH_SHIPMENTS)) {
      try {
        return JSON.parse(fs.readFileSync(PATH_SHIPMENTS, 'utf-8'));
      } catch (err) {
        console.error('Failed to parse shipments.json, fallback', err);
      }
    }
    return initialShipments;
  };

  const loadLogs = (): ActivityLog[] => {
    if (fs.existsSync(PATH_LOGS)) {
      try {
        return JSON.parse(fs.readFileSync(PATH_LOGS, 'utf-8'));
      } catch (err) {
        console.error('Failed to parse logs.json, fallback', err);
      }
    }
    return initialActivityLogs;
  };

  const loadUsers = (): RegisteredUser[] => {
    if (fs.existsSync(PATH_USERS)) {
      try {
        return JSON.parse(fs.readFileSync(PATH_USERS, 'utf-8'));
      } catch (err) {
        console.error('Failed to parse users.json, fallback', err);
      }
    }
    return defaultUsers;
  };

  const loadLogo = (): string | null => {
    if (fs.existsSync(PATH_LOGO)) {
      try {
        const payload = JSON.parse(fs.readFileSync(PATH_LOGO, 'utf-8'));
        return payload.logo || null;
      } catch (err) {
        console.error('Failed to parse logo.json, fallback', err);
      }
    }
    return null;
  };

  // Keep state in memory as single-source of truth and persist on write
  let shipments = loadShipments();
  let activityLogs = loadLogs();
  let registeredUsers = loadUsers();
  let companyLogo = loadLogo();
  let version = Date.now();

  const persistAll = () => {
    try {
      fs.writeFileSync(PATH_SHIPMENTS, JSON.stringify(shipments, null, 2), 'utf-8');
      fs.writeFileSync(PATH_LOGS, JSON.stringify(activityLogs, null, 2), 'utf-8');
      fs.writeFileSync(PATH_USERS, JSON.stringify(registeredUsers, null, 2), 'utf-8');
      fs.writeFileSync(PATH_LOGO, JSON.stringify({ logo: companyLogo }, null, 2), 'utf-8');
      version = Date.now();
    } catch (err) {
      console.error('Error writing persistence files', err);
    }
  };

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

  // 2. Add high-level action to overwrite full states if client changes locally when offline or as catch-all
  app.post('/api/state/sync-all', (req, res) => {
    const { clientShipments, clientLogs, clientUsers, clientLogo } = req.body;
    if (clientShipments) shipments = clientShipments;
    if (clientLogs) activityLogs = clientLogs;
    if (clientUsers) registeredUsers = clientUsers;
    if (clientLogo !== undefined) companyLogo = clientLogo;
    persistAll();
    res.json({ success: true, version });
  });

  // 3. Specific shipment actions
  app.post('/api/shipments', (req, res) => {
    const rawShipment = req.body;
    const today = new Date().toISOString().split('T')[0];
    const sequence = (shipments.length + 1).toString().padStart(4, '0');
    const newId = `BSL-2026-${sequence}`;

    const newShipment: Shipment = {
      ...rawShipment,
      id: newId,
      createdAt: today,
      updatedAt: today
    };

    shipments = [newShipment, ...shipments];
    persistAll();
    res.json({ success: true, shipment: newShipment, version });
  });

  app.put('/api/shipments/:id', (req, res) => {
    const { id } = req.params;
    const rawShipment = req.body;
    const today = new Date().toISOString().split('T')[0];

    const updatedShipment: Shipment = {
      ...rawShipment,
      id,
      updatedAt: today
    };

    shipments = shipments.map(item => item.id === id ? updatedShipment : item);
    persistAll();
    res.json({ success: true, shipment: updatedShipment, version });
  });

  app.delete('/api/shipments/:id', (req, res) => {
    const { id } = req.params;
    shipments = shipments.filter(item => item.id !== id);
    persistAll();
    res.json({ success: true, version });
  });

  app.post('/api/shipments/:id/approve', (req, res) => {
    const { id } = req.params;
    shipments = shipments.map(item => {
      if (item.id === id) {
        return { ...item, isApproved: true, cashFlowStatus: 'Funded (Active)' };
      }
      return item;
    });
    persistAll();
    res.json({ success: true, version });
  });

  // 4. Logs
  app.post('/api/logs', (req, res) => {
    const newLog: ActivityLog = req.body;
    activityLogs = [newLog, ...activityLogs];
    persistAll();
    res.json({ success: true, version });
  });

  // 5. Users
  app.post('/api/users', (req, res) => {
    const userPayload: RegisteredUser = req.body;
    const existingIdx = registeredUsers.findIndex(u => u.id === userPayload.id);
    if (existingIdx !== -1) {
      registeredUsers[existingIdx] = userPayload;
    } else {
      registeredUsers.push(userPayload);
    }
    persistAll();
    res.json({ success: true, version });
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    registeredUsers = registeredUsers.filter(u => u.id !== id);
    persistAll();
    res.json({ success: true, version });
  });

  // 6. Company Logo
  app.post('/api/logo', (req, res) => {
    const { logo } = req.body;
    companyLogo = logo;
    persistAll();
    res.json({ success: true, version });
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
