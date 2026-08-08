#!/usr/bin/env bash
set -e

PROJECT_NAME="field-dispatch-backend"

echo "Initializing NestJS project: $PROJECT_NAME..."
npx -y @nestjs/cli new $PROJECT_NAME --package-manager npm --skip-git --strict

cd $PROJECT_NAME

echo "Installing production dependencies..."
npm install \
  @nestjs/config \
  @nestjs/mongoose \
  mongoose \
  @nestjs/bullmq \
  bullmq \
  @nestjs/jwt \
  @nestjs/passport \
  passport \
  passport-jwt \
  pg \
  ioredis \
  bcrypt \
  class-validator \
  class-transformer

npm install --save-dev \
  @types/pg \
  @types/bcrypt \
  @types/passport-jwt \
  @types/node \
  @types/jest \
  @types/supertest \
  ts-jest

echo "Creating folder hierarchy..."
mkdir -p src/common/{filters,guards,decorators,interceptors}
mkdir -p src/modules/{auth,users,work-orders,execution-logs,queue}
mkdir -p src/database/{postgres,mongo}

echo "Project bootstrap script finished successfully!"