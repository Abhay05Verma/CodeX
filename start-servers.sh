#!/bin/bash
set -e

echo "Starting backend on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 2

echo "Starting frontend on port 3001..."
cd ../frontend
npm run dev -- --port 3001 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "CodeX servers started"
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "=========================================="
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
