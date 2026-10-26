import {
  applyDuplicatePolicy,
  clampName,
  duplicateKey,
  initialOf,
  MAX_NAME_LENGTH,
  normalizeName,
  prepareNameBatch,
  splitMultilineNames,
  validateParticipantName,
} from '@/features/participants/services/participantNormalization';

describe('normalizeName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  Rahim   Uddin \t')).toBe('Rahim Uddin');
    expect(normalizeName('A B')).toBe('A B');
  });

  it('strips control and zero-width characters but keeps Bengali joiners', () => {
    expect(normalizeName('Ra​him\u0007')).toBe('Rahim');
    const bengali = 'ক্‍ষ'; // ZWJ is meaningful in Indic scripts
    expect(normalizeName(bengali)).toBe(bengali);
  });

  it('normalizes Unicode to NFC', () => {
    expect(normalizeName('Café')).toBe('Café');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeName('   ')).toBe('');
    expect(normalizeName('')).toBe('');
  });
});

describe('validation', () => {
  it('rejects blank names', () => {
    expect(validateParticipantName('   ')).toEqual({ ok: false, code: 'EMPTY' });
  });

  it('accepts and cleans valid names', () => {
    expect(validateParticipantName('  নুসরাত  ')).toEqual({ ok: true, name: 'নুসরাত' });
  });

  it('shortens over-long names by code points, not UTF-16 units', () => {
    const long = '😀'.repeat(MAX_NAME_LENGTH + 5);
    const result = clampName(long);
    expect(result.truncated).toBe(true);
    expect(Array.from(result.name)).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe('splitMultilineNames', () => {
  it('splits on any line ending and counts blank lines', () => {
    expect(splitMultilineNames('A\nB\r\nC\rD')).toEqual({ names: ['A', 'B', 'C', 'D'], blankSkipped: 0 });
    expect(splitMultilineNames('A\n\n  \nB')).toEqual({ names: ['A', 'B'], blankSkipped: 2 });
  });

  it('does not count a trailing newline as a skipped row', () => {
    expect(splitMultilineNames('A\nB\n')).toEqual({ names: ['A', 'B'], blankSkipped: 0 });
  });
});

describe('duplicate policy', () => {
  it('duplicateKey ignores case and extra spaces', () => {
    expect(duplicateKey('  RAHIM ')).toBe(duplicateKey('rahim'));
  });

  it('keep (default): nothing is dropped, duplicates are only reported', () => {
    const r = applyDuplicatePolicy(['Rahim'], ['rahim', 'Nusrat', 'Nusrat'], 'keep');
    expect(r.names).toEqual(['rahim', 'Nusrat', 'Nusrat']);
    expect(r.duplicatesFound).toBe(2);
    expect(r.duplicatesSkipped).toBe(0);
  });

  it('skip: later duplicates and ones matching existing names are filtered and counted', () => {
    const r = applyDuplicatePolicy(['Rahim'], ['rahim', 'Nusrat', 'NUSRAT', 'Tanzim'], 'skip');
    expect(r.names).toEqual(['Nusrat', 'Tanzim']);
    expect(r.duplicatesFound).toBe(2);
    expect(r.duplicatesSkipped).toBe(2);
  });

  it('reports shortened names', () => {
    const r = applyDuplicatePolicy([], ['x'.repeat(200)], 'keep');
    expect(r.truncated).toBe(1);
    expect(Array.from(r.names[0])).toHaveLength(MAX_NAME_LENGTH);
  });

  it('prepareNameBatch combines splitting and the policy', () => {
    const r = prepareNameBatch('Rahim\n\nrahim\nNusrat', ['Tanzim'], 'skip');
    expect(r).toMatchObject({ names: ['Rahim', 'Nusrat'], blankSkipped: 1, duplicatesSkipped: 1 });
  });
});

describe('initialOf', () => {
  it('handles Latin, Bengali and emoji', () => {
    expect(initialOf('rahim')).toBe('R');
    expect(initialOf('নুসরাত')).toBe('ন');
    expect(initialOf('')).toBe('?');
    expect(initialOf('😀 Fun')).toBe('😀');
  });
});
