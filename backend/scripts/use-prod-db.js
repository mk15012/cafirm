#!/usr/bin/env node
/**
 * Switch to PRODUCTION PostgreSQL database
 * Run: node scripts/use-prod-db.js
 * 
 * This modifies schema.prisma to use PostgreSQL for production.
 * ALWAYS run this before committing!
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Switch to PostgreSQL
schema = schema.replace(
  /provider = "mysql"/,
  'provider = "postgresql"'
);

fs.writeFileSync(schemaPath, schema);
console.log('✅ Switched to PRODUCTION PostgreSQL database');
console.log('📌 Safe to commit now!');

