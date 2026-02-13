# How To Start CodeX

## Option 1: Start Both From Root
```bash
./start-servers.sh
```

## Option 2: Start Manually
Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev -- --port 3001
```

## Expected URLs
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`
- Backend health: `http://localhost:3000/health`

## Notes
- The frontend is configured separately from the backend; both processes must run together.
- If a port is already in use, stop the process on that port or change the port in the run command.
