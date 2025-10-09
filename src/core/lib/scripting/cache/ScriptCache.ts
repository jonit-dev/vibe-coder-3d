/**
 * Script Cache - LRU cache with TTL for compiled scripts
 */

import { ICompiledScript } from '../compiler/Instruction';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('ScriptCache');

export interface IScriptCache {
  get(id: string): ICompiledScript | undefined;
  set(id: string, compiled: ICompiledScript): void;
  has(id: string): boolean;
  stats(): { size: number; oldestMs: number };
  clear(): void;
  delete(id: string): void;
}

interface ICacheEntry {
  compiled: ICompiledScript;
  timestamp: number;
  lastAccess: number;
}

export class ScriptCache implements IScriptCache {
  private cache: Map<string, ICacheEntry>;
  private maxSize: number;
  private ttl: number;
  private debugMode: boolean;

  constructor(maxSize = 100, ttl = 5 * 60 * 1000, debugMode = false) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.debugMode = debugMode;
  }

  public get(id: string): ICompiledScript | undefined {
    this.evictExpired();

    const entry = this.cache.get(id);
    if (!entry) {
      if (this.debugMode) {
        logger.debug(`Cache miss: ${id}`);
      }
      return undefined;
    }

    // Update last access time (LRU)
    entry.lastAccess = Date.now();

    if (this.debugMode) {
      logger.debug(`Cache hit: ${id}`);
    }

    return entry.compiled;
  }

  public set(id: string, compiled: ICompiledScript): void {
    const now = Date.now();

    // If cache is full and this is a new entry, evict LRU entry
    if (this.maxSize > 0 && this.cache.size >= this.maxSize && !this.cache.has(id)) {
      this.evictLRU();
    }

    // Only set if maxSize allows it
    if (this.maxSize > 0 || this.cache.has(id)) {
      this.cache.set(id, {
        compiled,
        timestamp: now,
        lastAccess: now,
      });
    }

    if (this.debugMode) {
      logger.debug(`Cache set: ${id} (size: ${this.cache.size}/${this.maxSize})`);
    }
  }

  public has(id: string): boolean {
    this.evictExpired();
    return this.cache.has(id);
  }

  public delete(id: string): void {
    this.cache.delete(id);
    if (this.debugMode) {
      logger.debug(`Cache delete: ${id}`);
    }
  }

  public stats(): { size: number; oldestMs: number } {
    this.evictExpired();

    const now = Date.now();
    let oldestTimestamp = now;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      oldestMs: this.cache.size > 0 ? now - oldestTimestamp : 0,
    };
  }

  public clear(): void {
    this.cache.clear();
    if (this.debugMode) {
      logger.debug('Cache cleared');
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    const toEvict: string[] = [];

    for (const [id, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toEvict.push(id);
      }
    }

    for (const id of toEvict) {
      this.cache.delete(id);
      if (this.debugMode) {
        logger.debug(`Evicted expired: ${id}`);
      }
    }
  }

  private evictLRU(): void {
    let lruId: string | null = null;
    let lruTime = Infinity;

    for (const [id, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruId = id;
      }
    }

    if (lruId) {
      this.cache.delete(lruId);
      if (this.debugMode) {
        logger.debug(`Evicted LRU: ${lruId}`);
      }
    }
  }
}
