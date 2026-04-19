/**
 * Increments when the client session is explicitly invalidated (e.g. logout).
 * In-flight refresh responses must not apply if generation changed mid-flight.
 */
let generation = 0;

export function getSessionGeneration(): number {
  return generation;
}

export function invalidateClientSession(): void {
  generation += 1;
}
