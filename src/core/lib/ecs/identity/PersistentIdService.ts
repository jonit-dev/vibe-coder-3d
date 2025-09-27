import { idConfig } from './idSchema';

export class PersistentIdService {
  private reservedIds: Set<string> = new Set();

  generate(): string {
    return crypto.randomUUID();
  }

  generateUnique(): string {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts <= maxAttempts) {
      const id = this.generate();
      if (!this.isReserved(id)) {
        return id;
      }
      attempts++;
    }

    throw new Error('Failed to generate unique ID after 100 attempts');
  }

  reserve(id: string): void {
    if (!idConfig.validate(id)) {
      throw new Error('Invalid persistent ID');
    }
    this.reservedIds.add(id);
  }

  release(id: string): void {
    this.reservedIds.delete(id);
  }

  isReserved(id: string): boolean {
    return this.reservedIds.has(id);
  }

  clear(): void {
    this.reservedIds.clear();
  }
}
