import { describe, expect, it } from 'vitest';
import { applyChoice, calculateScore, endingText, events, getEnding, makeInitial, pickEvent, twistForChoice } from './game';

describe('Survive Sampai Gajian game logic', () => {
  it('picks a deterministic event for the same seed and day', () => {
    const state = makeInitial(123);
    expect(pickEvent(state).id).toBe(pickEvent(state).id);
  });

  it('applies choice effects, advances day, and records history', () => {
    const state = makeInitial(1);
    const event = events[0];
    const next = applyChoice(state, event, event.choices[0]);
    expect(next.day).toBe(2);
    expect(next.stats.money).toBe(700000);
    expect(next.history[0]).toContain('Ibu Kos');
  });

  it('keeps the first two days fair by avoiding harsh rent and debt events', () => {
    for (let seed = 1; seed < 30; seed++) {
      const state = makeInitial(seed);
      expect(['makan','transport','teman','bonus']).toContain(pickEvent(state).id);
    }
  });

  it('ends when core survival resources are depleted', () => {
    const state = makeInitial(1);
    state.stats.mental = 0;
    expect(getEnding(state)).toBe('collapsed');
  });

  it('adds deterministic twists after the fair opening days', () => {
    const state = makeInitial(9);
    state.day = 6;
    const twist = twistForChoice(state, events[0], events[0].choices[0]);
    expect(twist).toEqual(twistForChoice(state, events[0], events[0].choices[0]));
  });

  it('calculates a higher score for payday survivors', () => {
    const early = makeInitial(1);
    const finished = makeInitial(1);
    finished.day = 31;
    expect(calculateScore(finished)).toBeGreaterThan(calculateScore(early));
  });

  it('produces a payday ending after day 30', () => {
    const state = makeInitial(1);
    state.day = 31;
    expect(getEnding(state)).toBe('payday');
    expect(endingText('payday', state).title).toBe('LOLOS SAMPAI GAJIAN');
  });
});
