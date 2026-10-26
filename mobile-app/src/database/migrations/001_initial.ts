import type { Migration } from './types';

/**
 * v1: the complete initial schema.
 *
 * Design notes
 * - `draw_sessions.project_name` and `draw_participants` are SNAPSHOTS. History keeps working when a
 *   project is renamed, edited or deleted (`project_id` becomes NULL on delete).
 * - A partial unique index allows at most one *active* draw per project.
 * - `draw_winners.revealed_at` is NULL while a winner is saved but the reveal was not acknowledged,
 *   which lets the app restore the reveal after an interruption.
 */
export const migration001: Migration = {
  version: 1,
  name: 'initial schema',
  statements: [
    `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      archived_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects (archived_at, updated_at DESC)`,

    `CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_participants_project_position
       ON participants (project_id, position, id)`,

    `CREATE TABLE IF NOT EXISTS draw_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects (id) ON DELETE SET NULL,
      project_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
      requested_winner_count INTEGER NOT NULL CHECK (requested_winner_count >= 1),
      allow_repeat_winners INTEGER NOT NULL DEFAULT 0 CHECK (allow_repeat_winners IN (0, 1)),
      remove_selected_winners INTEGER NOT NULL DEFAULT 0 CHECK (remove_selected_winners IN (0, 1)),
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_draw_sessions_project ON draw_sessions (project_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_draw_sessions_history ON draw_sessions (status, completed_at DESC)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS uq_draw_sessions_one_active
       ON draw_sessions (project_id) WHERE status = 'active' AND project_id IS NOT NULL`,

    `CREATE TABLE IF NOT EXISTS draw_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_session_id INTEGER NOT NULL REFERENCES draw_sessions (id) ON DELETE CASCADE,
      source_participant_id INTEGER,
      display_name TEXT NOT NULL,
      position INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_draw_participants_session
       ON draw_participants (draw_session_id, position, id)`,

    `CREATE TABLE IF NOT EXISTS draw_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_session_id INTEGER NOT NULL REFERENCES draw_sessions (id) ON DELETE CASCADE,
      draw_participant_id INTEGER NOT NULL REFERENCES draw_participants (id) ON DELETE CASCADE,
      winner_order INTEGER NOT NULL,
      selected_at INTEGER NOT NULL,
      revealed_at INTEGER,
      UNIQUE (draw_session_id, winner_order)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_draw_winners_session ON draw_winners (draw_session_id, winner_order)`,

    `CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ],
};
