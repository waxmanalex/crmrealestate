#!/bin/bash
set -e

echo "🚀 Setting up ReCRM..."

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env from example"
  echo "⚠️  Edit backend/.env to set your DATABASE_URL before continuing"
fi

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your database credentials"
echo "  2. Run: cd backend && npx prisma migrate dev --name init"
echo "  3. Run: cd backend && npm run prisma:seed"
echo "  4. Run: cd backend && npm run dev"
echo "  5. Run: cd frontend && npm run dev  (in another terminal)"
echo ""
echo "  OR use Docker: docker-compose up -d"
echo ""
echo "Login: admin@recrm.com / admin123"
