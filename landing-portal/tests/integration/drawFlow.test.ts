import { describe, expect, it, vi } from 'vitest';
import type { Services } from '@/lib/services';
import { createDrawRepository } from '@/lib/db/repositories/drawRepository';
import { createTestApp, reopenTestApp } from '../helpers/testServices';
import { sequenceRng } from '../helpers/rng';

let clockValue = 1_000;
const clock = () => (clockValue += 10);

async function setup(rng: () => number = sequenceRng([0, 0, 0, 0, 0, 0])) {
  const app = createTestApp({ clock, rng });
  return { testDb: app.db, app, services: app.services };
}

async function makeProject(services: Services, names: string[], name = 'Team Lunch') {
  return services.projects.createProject({ name, description: '', participantNames: names });
}

describe('project creation', () => {
  it('creates a project with its participants atomically', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['  Rahim ', 'Nusrat', '', 'Tanzim']);
    expect((await services.participants.list(id)).map((p) => p.displayName)).toEqual(['Rahim', 'Nusrat', 'Tanzim']);
    expect(await services.projects.getStats()).toEqual({ projects: 1, participants: 3, winners: 0 });
  });

  it('validates the name and the participant list', async () => {
    const { services } = await setup();
    await expect(services.projects.createProject({ name: '  ', description: '', participantNames: ['A'] })).rejects.toMatchObject({
      errors: { name: 'REQUIRED' },
    });
    await expect(services.projects.createProject({ name: 'X', description: '', participantNames: [' ', ''] })).rejects.toMatchObject({
      errors: { participants: 'EMPTY_LIST' },
    });
    await expect(services.projects.createProject({ name: 'x'.repeat(100), description: '', participantNames: ['A'] })).rejects.toMatchObject({
      errors: { name: 'TOO_LONG' },
    });
    expect((await services.projects.listProjects()).length).toBe(0);
  });
});

describe('participants service', () => {
  it('adds with the duplicate policy and reports what happened', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['Rahim']);
    const kept = await services.participants.addNames(id, ['rahim', 'Nusrat', ' '], 'keep');
    expect(kept).toMatchObject({ inserted: 2, duplicatesFound: 1, duplicatesSkipped: 0, blankSkipped: 1 });
    const skipped = await services.participants.addNames(id, ['RAHIM', 'Tanzim'], 'skip');
    expect(skipped).toMatchObject({ inserted: 1, duplicatesSkipped: 1 });
    expect((await services.participants.list(id)).map((p) => p.displayName)).toEqual(['Rahim', 'rahim', 'Nusrat', 'Tanzim']);
  });

  it('edits, moves, removes and clears', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    let list = await services.participants.list(id);
    await services.participants.rename(id, list[0].id, '  Alpha ');
    await services.participants.move(id, list[2].id, 'up');
    await services.participants.move(id, list[0].id, 'up'); // already first: no-op
    list = await services.participants.list(id);
    expect(list.map((p) => p.displayName)).toEqual(['Alpha', 'C', 'B']);
    await expect(services.participants.rename(id, list[0].id, '   ')).rejects.toMatchObject({ code: 'EMPTY_NAME' });
    expect(await services.participants.remove(id, [list[1].id])).toBe(1);
    expect((await services.participants.list(id)).map((p) => p.position)).toEqual([0, 1]);
    expect(await services.participants.clear(id)).toBe(2);
  });
});

describe('draw sessions', () => {
  it('starts a draw with a roster snapshot and default rules', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId, resumed } = await services.draws.startOrResume(id);
    expect(resumed).toBe(false);
    const snap = await services.draws.load(drawId);
    expect(snap?.participants.map((p) => p.displayName)).toEqual(['A', 'B', 'C']);
    expect(snap?.session).toMatchObject({ status: 'active', projectName: 'Team Lunch', requestedWinnerCount: 1, allowRepeatWinners: false, removeSelectedWinners: false });
  });

  it('refuses to start without participants or for a missing project', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A']);
    const list = await services.participants.list(id);
    await services.participants.remove(id, [list[0].id]);
    await expect(services.draws.startOrResume(id)).rejects.toMatchObject({ code: 'NO_PARTICIPANTS' });
    await expect(services.draws.startOrResume(9999)).rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND' });
  });

  it('resumes the unfinished draw instead of creating a second one', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const first = await services.draws.startOrResume(id);
    const second = await services.draws.startOrResume(id);
    expect(second).toEqual({ drawId: first.drawId, resumed: true });
  });

  it('saves the winner BEFORE the reveal and blocks the next spin until it is acknowledged', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 2, allowRepeatWinners: false, removeSelectedWinners: false });

    const spin = await services.draws.spin(drawId);
    expect(spin).toMatchObject({ order: 1, requested: 2, poolIndex: 0 });
    expect(spin.winner.displayName).toBe('A');
    // persisted already, though not yet revealed
    const saved = await services.draws.load(drawId);
    expect(saved?.winners).toHaveLength(1);
    expect(saved?.winners[0].revealedAt).toBeNull();

    // double tap / second instance: refused, no duplicate winner is created
    await expect(services.draws.spin(drawId)).rejects.toMatchObject({ code: 'PENDING_REVEAL' });
    expect((await services.draws.load(drawId))?.winners).toHaveLength(1);

    await services.draws.acknowledgeWinner(spin.winner.id);
    const second = await services.draws.spin(drawId);
    expect(second.order).toBe(2);
    expect(second.winner.displayName).toBe('B'); // A is excluded: pool is [B, C], rng 0 -> B
    expect(second.pool.map((p) => p.displayName)).toEqual(['B', 'C']);
  });

  it('recovers an interrupted draw after the app is closed and reopened', async () => {
    const { app, services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(id);
    const spin = await services.draws.spin(drawId); // app is killed before the modal is acknowledged

    const after = (await reopenTestApp(app, { clock })).services;
    const resumed = await after.draws.startOrResume(id);
    expect(resumed).toEqual({ drawId, resumed: true });
    const snap = await after.draws.load(drawId);
    expect(snap?.winners).toHaveLength(1);
    expect(snap?.winners[0]).toMatchObject({ id: spin.winner.id, displayName: 'A', revealedAt: null });
  });

  it('enforces the rules: no repeats, valid winner counts, completed draws', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const { drawId } = await services.draws.startOrResume(id);
    await expect(services.draws.updateRules(drawId, { requestedWinnerCount: 3, allowRepeatWinners: false, removeSelectedWinners: false })).rejects.toMatchObject({
      code: 'INVALID_WINNER_COUNT',
      detail: { max: 2 },
    });
    // repeats allowed: more winners than people is fine
    await services.draws.updateRules(drawId, { requestedWinnerCount: 3, allowRepeatWinners: true, removeSelectedWinners: false });

    await services.draws.updateRules(drawId, { requestedWinnerCount: 2, allowRepeatWinners: false, removeSelectedWinners: false });
    const w1 = await services.draws.spin(drawId);
    await services.draws.acknowledgeWinner(w1.winner.id);
    await expect(services.draws.updateRules(drawId, { requestedWinnerCount: 1, allowRepeatWinners: false, removeSelectedWinners: false })).resolves.toBeDefined();
    const w2Attempt = services.draws.spin(drawId);
    await expect(w2Attempt).rejects.toMatchObject({ code: 'DRAW_COMPLETE' });
  });

  it('cannot choose fewer winners than already drawn', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 3, allowRepeatWinners: false, removeSelectedWinners: false });
    for (let i = 0; i < 2; i++) {
      const s = await services.draws.spin(drawId);
      await services.draws.acknowledgeWinner(s.winner.id);
    }
    await expect(services.draws.updateRules(drawId, { requestedWinnerCount: 1, allowRepeatWinners: false, removeSelectedWinners: false })).rejects.toMatchObject({
      code: 'BELOW_DRAWN',
      detail: { drawn: 2 },
    });
  });

  it('draws several winners in order, finishes, and writes history', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C', 'D']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 3, allowRepeatWinners: false, removeSelectedWinners: false });
    const names: string[] = [];
    for (let i = 0; i < 3; i++) {
      const s = await services.draws.spin(drawId);
      names.push(s.winner.displayName);
      await services.draws.acknowledgeWinner(s.winner.id);
    }
    expect(names).toEqual(['A', 'B', 'C']);
    const outcome = await services.draws.finish(drawId);
    expect(outcome.removedFromProject).toBe(0);

    const list = await services.history.list({ order: 'newest' });
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ projectName: 'Team Lunch', participantCount: 4, winnerCount: 3, winnerNames: ['A', 'B', 'C'] });
    const detail = await services.history.getDetail(drawId);
    expect(detail?.winners.map((w) => [w.winnerOrder, w.displayName])).toEqual([[1, 'A'], [2, 'B'], [3, 'C']]);
    expect(await services.projects.getStats()).toMatchObject({ winners: 3 });
    // a finished draw cannot be spun or finished again
    await expect(services.draws.spin(drawId)).rejects.toMatchObject({ code: 'NOT_ACTIVE' });
    await expect(services.draws.finish(drawId)).rejects.toMatchObject({ code: 'NOT_ACTIVE' });
  });

  it('refuses to finish a draw with no winners', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A']);
    const { drawId } = await services.draws.startOrResume(id);
    await expect(services.draws.finish(drawId)).rejects.toMatchObject({ code: 'NOTHING_DRAWN' });
  });

  it('removes winners from the project list when that rule is on, keeping the history snapshot', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 2, allowRepeatWinners: true, removeSelectedWinners: true });
    const rules = (await services.draws.load(drawId))?.session;
    expect(rules?.allowRepeatWinners).toBe(false); // conflicting option is normalized

    for (let i = 0; i < 2; i++) {
      const s = await services.draws.spin(drawId);
      await services.draws.acknowledgeWinner(s.winner.id);
    }
    const outcome = await services.draws.finish(drawId);
    expect(outcome.removedFromProject).toBe(2);
    expect((await services.participants.list(id)).map((p) => p.displayName)).toEqual(['C']);
    const detail = await services.history.getDetail(drawId);
    expect(detail?.participants.map((p) => p.displayName)).toEqual(['A', 'B', 'C']);
  });

  it('next draw starts from the last completed rules', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const first = await services.draws.startOrResume(id);
    await services.draws.updateRules(first.drawId, { requestedWinnerCount: 2, allowRepeatWinners: false, removeSelectedWinners: false });
    for (let i = 0; i < 2; i++) {
      const s = await services.draws.spin(first.drawId);
      await services.draws.acknowledgeWinner(s.winner.id);
    }
    await services.draws.finish(first.drawId);
    const second = await services.draws.startOrResume(id);
    expect(second.drawId).not.toBe(first.drawId);
    expect((await services.draws.load(second.drawId))?.session.requestedWinnerCount).toBe(2);
  });
});

describe('history snapshots stay frozen', () => {
  async function finishedDraw() {
    const ctx = await setup();
    const id = await makeProject(ctx.services, ['Alpha', 'Beta', 'Gamma']);
    const { drawId } = await ctx.services.draws.startOrResume(id);
    const s = await ctx.services.draws.spin(drawId);
    await ctx.services.draws.acknowledgeWinner(s.winner.id);
    await ctx.services.draws.finish(drawId);
    return { ...ctx, projectId: id, drawId };
  }

  it('editing, removing or renaming current participants never changes a completed draw', async () => {
    const { services, projectId, drawId } = await finishedDraw();
    const list = await services.participants.list(projectId);
    await services.participants.rename(projectId, list[0].id, 'CHANGED');
    await services.participants.remove(projectId, [list[1].id]);
    await services.projects.updateProject(projectId, { name: 'Renamed', description: '' });

    const detail = await services.history.getDetail(drawId);
    expect(detail?.session.projectName).toBe('Team Lunch');
    expect(detail?.participants.map((p) => p.displayName)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(detail?.winners[0].displayName).toBe('Alpha');
  });

  it('deleting the project keeps the finished draw in history', async () => {
    const { services, projectId, drawId } = await finishedDraw();
    await services.projects.deleteProject(projectId);
    const detail = await services.history.getDetail(drawId);
    expect(detail?.session.projectId).toBeNull();
    expect(detail?.participants).toHaveLength(3);
    expect(await services.history.list({})).toHaveLength(1);
  });

  it('deleting a project discards only its unfinished draw', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.projects.deleteProject(id);
    expect(await services.draws.load(drawId)).toBeNull();
  });

  it('returns null for unknown or unfinished history ids', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A']);
    const { drawId } = await services.draws.startOrResume(id);
    expect(await services.history.getDetail(drawId)).toBeNull(); // still active
    expect(await services.history.getDetail(424242)).toBeNull();
  });

  it('searches and sorts history, and paginates', async () => {
    const { services } = await setup();
    const ids: number[] = [];
    for (const [i, name] of ['Lunch', 'Giveaway', 'Class Monitor'].entries()) {
      const id = await makeProject(services, [`Person${i}`, 'Shared'], name);
      const { drawId } = await services.draws.startOrResume(id);
      const s = await services.draws.spin(drawId);
      await services.draws.acknowledgeWinner(s.winner.id);
      await services.draws.finish(drawId);
      ids.push(drawId);
    }
    expect((await services.history.list({ order: 'newest' })).map((h) => h.projectName)).toEqual(['Class Monitor', 'Giveaway', 'Lunch']);
    expect((await services.history.list({ order: 'oldest' })).map((h) => h.projectName)).toEqual(['Lunch', 'Giveaway', 'Class Monitor']);
    expect((await services.history.list({ search: 'give' })).map((h) => h.projectName)).toEqual(['Giveaway']);
    expect((await services.history.list({ search: 'person1' })).map((h) => h.projectName)).toEqual(['Giveaway']); // winner name search
    expect((await services.history.list({ limit: 2, offset: 0 }))).toHaveLength(2);
    expect((await services.history.list({ limit: 2, offset: 2 }))).toHaveLength(1);
    expect(await services.history.count()).toBe(3);
  });
});

describe('roster sync and reset', () => {
  it('re-snapshots silently when the list changed before any winner', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const { drawId } = await services.draws.startOrResume(id);
    expect(await services.draws.syncRoster(drawId)).toBe('in_sync');
    await services.participants.addNames(id, ['C'], 'keep');
    expect(await services.draws.syncRoster(drawId)).toBe('resnapshotted');
    expect((await services.draws.load(drawId))?.participants.map((p) => p.displayName)).toEqual(['A', 'B', 'C']);
    expect(await services.draws.syncRoster(drawId)).toBe('in_sync');
  });

  it('resets winners when the list changes after a winner was picked', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(id);
    const s = await services.draws.spin(drawId);
    await services.draws.acknowledgeWinner(s.winner.id);
    const list = await services.participants.list(id);
    await services.participants.remove(id, [list[2].id]);
    expect(await services.draws.syncRoster(drawId)).toBe('reset');
    const snap = await services.draws.load(drawId);
    expect(snap?.winners).toEqual([]);
    expect(snap?.participants.map((p) => p.displayName)).toEqual(['A', 'B']);
  });

  it('clamps the winner count when the roster shrinks', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B', 'C', 'D']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 4, allowRepeatWinners: false, removeSelectedWinners: false });
    const list = await services.participants.list(id);
    await services.participants.remove(id, [list[0].id, list[1].id]);
    await services.draws.syncRoster(drawId);
    expect((await services.draws.load(drawId))?.session.requestedWinnerCount).toBe(2);
  });

  it('keeps the draw name in sync with a renamed project', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A']);
    const { drawId } = await services.draws.startOrResume(id);
    await services.projects.updateProject(id, { name: 'New Name', description: '' });
    await services.draws.syncRoster(drawId);
    expect((await services.draws.load(drawId))?.session.projectName).toBe('New Name');
  });

  it('restarts a draw on request without touching history', async () => {
    const { services } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const done = await services.draws.startOrResume(id);
    const s0 = await services.draws.spin(done.drawId);
    await services.draws.acknowledgeWinner(s0.winner.id);
    await services.draws.finish(done.drawId);

    const { drawId } = await services.draws.startOrResume(id);
    const s = await services.draws.spin(drawId);
    await services.draws.acknowledgeWinner(s.winner.id);
    await services.draws.reset(drawId);
    expect((await services.draws.load(drawId))?.winners).toEqual([]);
    expect(await services.history.list({})).toHaveLength(1);
  });

  it('opening the same project twice at once still gives a single active draw', async () => {
    const { services, testDb } = await setup();
    const id = await makeProject(services, ['A']);
    const [a, b] = await Promise.all([services.draws.startOrResume(id), services.draws.startOrResume(id)]);
    expect(a.drawId).toBe(b.drawId);
    expect(await testDb.drawSessions.where('projectId').equals(id).count()).toBe(1);
  });
});

describe('transaction safety of a spin', () => {
  it('leaves no half-saved winner when saving fails mid-spin', async () => {
    const { services, testDb } = await setup();
    const id = await makeProject(services, ['A', 'B']);
    const { drawId } = await services.draws.startOrResume(id);
    const failing = vi.spyOn(testDb.drawSessions, 'update').mockRejectedValueOnce(new Error('disk full'));
    await expect(services.draws.spin(drawId)).rejects.toThrow('disk full');
    failing.mockRestore();
    expect((await services.draws.load(drawId))?.winners).toEqual([]);
  });
});

describe('picking more winners after the planned ones (2nd place, 3rd place)', () => {
  it('extends the draw by one, excludes earlier winners and stops when nobody is left', async () => {
    const { services, testDb } = await setup(sequenceRng([0, 0, 0]));
    const projectId = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(projectId);
    const repo = createDrawRepository(testDb);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 1, allowRepeatWinners: false, removeSelectedWinners: false });

    const first = await services.draws.spin(drawId);
    await services.draws.acknowledgeWinner(first.winner.id);
    await expect(services.draws.spin(drawId)).rejects.toMatchObject({ code: 'DRAW_COMPLETE' });

    expect((await services.draws.addWinnerSlot(drawId)).requestedWinnerCount).toBe(2);
    const second = await services.draws.spin(drawId);
    expect(second.order).toBe(2);
    expect(second.pool.map((p) => p.displayName)).toEqual(['B', 'C']); // A is off the wheel
    expect(second.winner.displayName).toBe('B');
    await services.draws.acknowledgeWinner(second.winner.id);

    await services.draws.addWinnerSlot(drawId);
    const third = await services.draws.spin(drawId);
    expect(third.pool.map((p) => p.displayName)).toEqual(['C']);
    await services.draws.acknowledgeWinner(third.winner.id);

    await expect(services.draws.addWinnerSlot(drawId)).rejects.toMatchObject({ code: 'NO_ELIGIBLE' });
    expect((await repo.getSession(drawId))!.requestedWinnerCount).toBe(3);
  });

  it('does not add a slot when one is already open, and refuses a finished draw', async () => {
    const { services } = await setup(sequenceRng([0]));
    const projectId = await makeProject(services, ['A', 'B', 'C']);
    const { drawId } = await services.draws.startOrResume(projectId);
    await services.draws.updateRules(drawId, { requestedWinnerCount: 3, allowRepeatWinners: false, removeSelectedWinners: false });
    expect((await services.draws.addWinnerSlot(drawId)).requestedWinnerCount).toBe(3);
    const w = await services.draws.spin(drawId);
    await services.draws.acknowledgeWinner(w.winner.id);
    await services.draws.finish(drawId);
    await expect(services.draws.addWinnerSlot(drawId)).rejects.toMatchObject({ code: 'NOT_ACTIVE' });
  });
});
