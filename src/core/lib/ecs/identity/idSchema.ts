import { z } from 'zod';

export type IdKind = 'string';

export const PersistentIdSchema = z.object({
  id: z.string().min(1, 'Persistent ID cannot be empty'),
});

export const idConfig = {
  kind: 'string' as const satisfies IdKind,
  validate: (id: string): boolean => {
    try {
      PersistentIdSchema.parse({ id });
      return true;
    } catch {
      return false;
    }
  },
  parse: (id: string): string => {
    const result = PersistentIdSchema.safeParse({ id });
    if (!result.success) {
      throw new Error('Invalid persistent ID');
    }
    return id;
  },
};

export type PersistentIdData = z.infer<typeof PersistentIdSchema>;
