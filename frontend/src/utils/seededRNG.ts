// Seeded Random Number Generator (Mulberry32) - Deterministic data generation
// Seed: 26026 as specified in mock-data.md

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = this._seed(seed);
  }

  private _seed(seed: number): number {
    // Ensure non-zero state
    if (seed === 0) return 123456789;
    return seed & 0xFFFFFFFF;
  }

  private next(): number {
    // Mulberry32 algorithm
    let s = this.state;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.state = s;
    return s >>> 0;
  }

  random(): number {
    return this.next() / 0xFFFFFFFF;
  }

  nextInt(max: number): number {
    return Math.floor(this.random() * max);
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
}

export const MOCK_DATA_SEED = 26026;

export function createMockRNG() {
  return new SeededRandom(MOCK_DATA_SEED);
}

export function seededRandomFloat(rng: SeededRandom): number {
  return rng.random();
}

export function seededRandomInt(rng: SeededRandom, max: number): number {
  return Math.floor(rng.random() * max);
}

export function seededRandomIntInRange(rng: SeededRandom, min: number, max: number): number {
  return Math.floor(rng.random() * (max - min)) + min;
}