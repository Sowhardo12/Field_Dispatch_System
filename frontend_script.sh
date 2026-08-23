#!/usr/bin/env bash

set -e

echo "🚀 Starting Next.js 14 Work Order Frontend Setup..."

# 1. Create Next.js 14 project with Tailwind CSS and App Router
npx create-next-app@14 frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-git

cd frontend

echo "📦 Installing project dependencies..."

# 2. Install dependencies for UI, Forms, Queries, Sockets, and Utilities
npm install axios @tanstack/react-query zustand react-hook-form @hookform/resolvers zod lucide-react sonner socket.io-client clsx tailwind-merge

echo "📁 Creating project folder hierarchy..."

# 3. Create folder hierarchy reflecting accurate backend domains
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/work-orders/\[id\]
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/layout
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/types

# 4. Create environment variables config
cat << 'EOF' > .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000/notifications
EOF

# 5. Create Tailwind utility helper
cat << 'EOF' > src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

echo "✅ Project setup complete!"
echo ""
echo "Next steps:"
echo "1. cd frontend"
echo "2. npm run dev"
echo "3. Confirm app opens at http://localhost:3000"