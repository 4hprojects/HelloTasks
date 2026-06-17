/**
 * Role migration script — maps legacy role values to canonical names.
 *
 * Run once against your Atlas (or local) database:
 *   node scripts/migrate-roles.js
 *
 * What it does:
 *   Users:
 *     super_admin  → globalRole: 'system_admin', systemRole: 'system_admin'
 *     project_lead → globalRole: 'manager',      systemRole: 'user'
 *     developer    → globalRole: 'member',        systemRole: 'user'
 *     (quality_manager and viewer are unchanged)
 *
 *   Project members:
 *     project_lead → manager
 *     developer    → member
 *
 * Safe to run multiple times — uses $set only on matched documents.
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const users    = db.collection('users');
  const projects = db.collection('projects');

  // ── Users ───────────────────────────────────────────────────
  const userMigrations = [
    {
      filter: { globalRole: 'super_admin' },
      update: { $set: { globalRole: 'system_admin', systemRole: 'system_admin', defaultRole: 'viewer' } }
    },
    {
      filter: { globalRole: 'project_lead' },
      update: { $set: { globalRole: 'manager', systemRole: 'user', defaultRole: 'viewer' } }
    },
    {
      filter: { globalRole: 'developer' },
      update: { $set: { globalRole: 'member', systemRole: 'user', defaultRole: 'viewer' } }
    },
    // Ensure all remaining users get the new fields if not already set
    {
      filter: { systemRole: { $exists: false } },
      update: { $set: { systemRole: 'user', defaultRole: 'viewer' } }
    }
  ];

  for (const { filter, update } of userMigrations) {
    const result = await users.updateMany(filter, update);
    console.log(`Users — filter ${JSON.stringify(filter)}: ${result.modifiedCount} updated`);
  }

  // ── Project members ──────────────────────────────────────────
  const projectMigrations = [
    {
      filter: { 'members.role': 'project_lead' },
      update: { $set: { 'members.$[el].role': 'manager' } },
      options: { arrayFilters: [{ 'el.role': 'project_lead' }] }
    },
    {
      filter: { 'members.role': 'developer' },
      update: { $set: { 'members.$[el].role': 'member' } },
      options: { arrayFilters: [{ 'el.role': 'developer' }] }
    }
  ];

  for (const { filter, update, options } of projectMigrations) {
    const result = await projects.updateMany(filter, update, options);
    console.log(`Projects — filter ${JSON.stringify(filter)}: ${result.modifiedCount} updated`);
  }

  console.log('Migration complete.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
