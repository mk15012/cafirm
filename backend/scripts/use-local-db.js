#!/usr/bin/env node
/**
 * Switch to LOCAL MySQL database
 * Run: node scripts/use-local-db.js
 * 
 * This modifies schema.prisma to use MySQL for local development.
 * DO NOT COMMIT schema.prisma after running this!
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Switch to MySQL
schema = schema.replace(
  /provider = "postgresql"/,
  'provider = "mysql"'
);

fs.writeFileSync(schemaPath, schema);
console.log('✅ Switched to LOCAL MySQL database');
console.log('📌 Run: npx prisma generate');
console.log('⚠️  Remember: Run "node scripts/use-prod-db.js" before committing!');


