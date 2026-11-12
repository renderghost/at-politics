import { describe, expect, it } from 'vitest';
import { hemicycleSeats } from './hemicycle';

describe('hemicycleSeats', () => {
  it('places exactly 720 seats by default', () => {
    expect(hemicycleSeats()).toHaveLength(720);
  });
  it('keeps every seat in the upper half, inside the viewBox', () => {
    for (const s of hemicycleSeats()) {
      expect(s.y).toBeLessThanOrEqual(500);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1000);
    }
  });
  it('orders seats left to right', () => {
    const seats = hemicycleSeats(30, 3);
    for (let i = 1; i < seats.length; i++) expect(seats[i]!.angle).toBeLessThanOrEqual(seats[i - 1]!.angle);
  });
});
