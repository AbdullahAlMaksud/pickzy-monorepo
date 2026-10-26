import { MIGRATIONS, SCHEMA_VERSION, getSchemaVersion, runMigrations } from '@/database/migrations';
import type { Migration } from '@/database/migrations/types';
import { createParticipantRepository } from '@/database/repositories/participantRepository';
import { createProjectRepository } from '@/database/repositories/projectRepository';
import { createPreferencesRepository } from '@/database/repositories/preferencesRepository';
import { DatabaseError } from '@/database/types';
import { createTestDatabase, reopenTestDatabase } from '../helpers/testDatabase';

describe('migrations', () => {
  it('creates the full schema and records the version', async () => {
    const { db } = await createTestDatabase();
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const tables = await db.getAllAsync<{ name: string }>(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
    expect(tables.map((t) => t.name)).toEqual(['draw_participants', 'draw_sessions', 'draw_winners', 'participants', 'preferences', 'projects']);
    const indexes = await db.getAllAsync<{ name: string }>(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' OR name LIKE 'uq_%'`);
    expect(indexes.map((i) => i.name)).toEqual(expect.arrayContaining(['idx_participants_project_position', 'uq_draw_sessions_one_active']));
  });

  it('is idempotent: running again changes nothing', async () => {
    const { db } = await createTestDatabase();
    await createProjectRepository(db).insert({ name: 'Keep me', description: '', now: 1 });
    expect(await runMigrations(db)).toEqual({ from: SCHEMA_VERSION, to: SCHEMA_VERSION });
    expect(await createProjectRepository(db).listSummaries()).toHaveLength(1);
  });

  it('upgrades step by step and keeps existing data', async () => {
    const v2: Migration = {
      version: 2,
      name: 'add color to projects',
      statements: [`ALTER TABLE projects ADD COLUMN color TEXT NOT NULL DEFAULT 'violet'`],
    };
    const { db } = await createTestDatabase();
    const id = await createProjectRepository(db).insert({ name: 'Old', description: '', now: 1 });
    await runMigrations(db, [...MIGRATIONS, v2]);
    expect(await getSchemaVersion(db)).toBe(2);
    const row = await db.getFirstAsync<{ name: string; color: string }>('SELECT name, color FROM projects WHERE id = ?', [id]);
    expect(row).toEqual({ name: 'Old', color: 'violet' });
  });

  it('rolls a failing migration back completely (data and version untouched)', async () => {
    const { db } = await createTestDatabase();
    const broken: Migration = {
      version: SCHEMA_VERSION + 1,
      name: 'broken',
      statements: ['CREATE TABLE half_done (id INTEGER)', 'THIS IS NOT SQL'],
    };
    await expect(runMigrations(db, [...MIGRATIONS, broken])).rejects.toMatchObject({ code: 'MIGRATION_FAILED' });
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const leftover = await db.getFirstAsync(`SELECT name FROM sqlite_master WHERE name = 'half_done'`);
    expect(leftover).toBeNull();
  });

  it('refuses to touch a database from a newer app version', async () => {
    const { db } = await createTestDatabase();
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION + 5}`);
    await expect(runMigrations(db)).rejects.toMatchObject({ code: 'NEWER_SCHEMA' });
    await expect(runMigrations(db)).rejects.toBeInstanceOf(DatabaseError);
  });
});

describe('transactions', () => {
  it('commits when the callback resolves', async () => {
    const { db } = await createTestDatabase();
    await db.transaction(async (tx) => {
      await createProjectRepository(tx).insert({ name: 'A', description: '', now: 1 });
    });
    expect(await createProjectRepository(db).listSummaries()).toHaveLength(1);
  });

  it('rolls everything back when the callback throws', async () => {
    const { db } = await createTestDatabase();
    await expect(
      db.transaction(async (tx) => {
        const id = await createProjectRepository(tx).insert({ name: 'A', description: '', now: 1 });
        await createParticipantRepository(tx).appendMany(id, ['x', 'y'], 1);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await createProjectRepository(db).listSummaries()).toHaveLength(0);
    expect((await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM participants'))?.c).toBe(0);
  });

  it('keeps working after a rollback', async () => {
    const { db } = await createTestDatabase();
    await db.transaction(async () => {
      throw new Error('x');
    }).catch(() => undefined);
    await db.transaction(async (tx) => {
      await createProjectRepository(tx).insert({ name: 'ok', description: '', now: 1 });
    });
    expect(await createProjectRepository(db).listSummaries()).toHaveLength(1);
  });
});

describe('project and participant repositories', () => {
  it('supports project CRUD with live counts', async () => {
    const { db } = await createTestDatabase();
    const projects = createProjectRepository(db);
    const id = await projects.insert({ name: 'Team Lunch', description: 'pick one', now: 100 });
    await createParticipantRepository(db).appendMany(id, ['Rahim', 'Nusrat'], 100);
    expect((await projects.getById(id))?.description).toBe('pick one');
    expect((await projects.getSummary(id))?.participantCount).toBe(2);

    await projects.update(id, { name: 'Office Lunch', description: '', now: 200 });
    expect(await projects.getById(id)).toMatchObject({ name: 'Office Lunch', updatedAt: 200, createdAt: 100 });

    await projects.delete(id);
    expect(await projects.getById(id)).toBeNull();
  });

  it('orders the project list by most recent activity and searches names literally', async () => {
    const { db } = await createTestDatabase();
    const projects = createProjectRepository(db);
    await projects.insert({ name: 'Old', description: '', now: 1 });
    await projects.insert({ name: '100% fun_day', description: '', now: 3 });
    await projects.insert({ name: 'Newest', description: '', now: 5 });
    expect((await projects.listSummaries()).map((p) => p.name)).toEqual(['Newest', '100% fun_day', 'Old']);
    expect((await projects.listSummaries({ search: '%' })).map((p) => p.name)).toEqual(['100% fun_day']);
    expect((await projects.listSummaries({ search: '_' })).map((p) => p.name)).toEqual(['100% fun_day']);
    expect((await projects.listSummaries({ search: "x'; DROP TABLE projects;--" }))).toEqual([]);
    expect(await projects.listSummaries()).toHaveLength(3);
  });

  it('appends, renames, reorders and deletes participants with stable positions', async () => {
    const { db } = await createTestDatabase();
    const id = await createProjectRepository(db).insert({ name: 'P', description: '', now: 1 });
    const repo = createParticipantRepository(db);
    expect(await repo.appendMany(id, ['A', 'B', 'C'], 1)).toBe(3);
    expect(await repo.appendMany(id, ['D'], 2)).toBe(1);
    let list = await repo.listByProject(id);
    expect(list.map((p) => [p.displayName, p.position])).toEqual([['A', 0], ['B', 1], ['C', 2], ['D', 3]]);

    await repo.rename(list[1].id, 'Bee', 3);
    await repo.applyOrder(id, [list[3].id, list[0].id, list[1].id, list[2].id], 4);
    list = await repo.listByProject(id);
    expect(list.map((p) => p.displayName)).toEqual(['D', 'A', 'Bee', 'C']);

    await repo.deleteByIds(id, [list[1].id]);
    await repo.compactPositions(id);
    list = await repo.listByProject(id);
    expect(list.map((p) => [p.displayName, p.position])).toEqual([['D', 0], ['Bee', 1], ['C', 2]]);
  });

  it('inserts large batches across the bound-parameter limit', async () => {
    const { db } = await createTestDatabase();
    const id = await createProjectRepository(db).insert({ name: 'Big', description: '', now: 1 });
    const names = Array.from({ length: 2500 }, (_, i) => `Person ${i}`);
    const repo = createParticipantRepository(db);
    expect(await repo.appendMany(id, names, 1)).toBe(2500);
    const list = await repo.listByProject(id);
    expect(list).toHaveLength(2500);
    expect(list[2499]).toMatchObject({ displayName: 'Person 2499', position: 2499 });
    const removed = await repo.deleteByIds(id, list.slice(0, 1200).map((p) => p.id));
    expect(removed).toBe(1200);
  });

  it('stores Bengali names unchanged', async () => {
    const { db } = await createTestDatabase();
    const id = await createProjectRepository(db).insert({ name: 'প্রকল্প', description: 'বর্ণনা', now: 1 });
    await createParticipantRepository(db).appendMany(id, ['নুসরাত', 'তানজিম'], 1);
    expect((await createParticipantRepository(db).listByProject(id)).map((p) => p.displayName)).toEqual(['নুসরাত', 'তানজিম']);
    expect((await createProjectRepository(db).getById(id))?.name).toBe('প্রকল্প');
  });

  it('cascades participant deletion with the project', async () => {
    const { db } = await createTestDatabase();
    const id = await createProjectRepository(db).insert({ name: 'P', description: '', now: 1 });
    await createParticipantRepository(db).appendMany(id, ['A'], 1);
    await createProjectRepository(db).delete(id);
    expect(await createParticipantRepository(db).count(id)).toBe(0);
  });
});

describe('preferences repository', () => {
  it('upserts values and survives a reopen of the database', async () => {
    const first = await createTestDatabase();
    const prefs = createPreferencesRepository(first.db);
    await prefs.set('ui.theme', 'dark', 1);
    await prefs.set('ui.theme', 'light', 2);
    await prefs.set('profile.displayName', 'আব্দুল্লাহ', 2);
    expect(await prefs.get('ui.theme')).toBe('light');

    const reopened = await reopenTestDatabase(first.export());
    expect(await createPreferencesRepository(reopened.db).getAll()).toEqual({ 'ui.theme': 'light', 'profile.displayName': 'আব্দুল্লাহ' });
  });
});
