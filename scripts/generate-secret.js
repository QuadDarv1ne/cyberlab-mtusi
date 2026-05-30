#!/usr/bin/env node

/**
 * Generate a secure random secret for NEXTAUTH_SECRET
 * Usage: node scripts/generate-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('NEXTAUTH_SECRET=' + secret);
console.log('\nAdd this to your .env.local file (do NOT commit it!)');
