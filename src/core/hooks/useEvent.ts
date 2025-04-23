import { useEffect } from 'react';

import { CoreEvents, on } from '@/core/lib/events';

export function useEvent<K extends keyof CoreEvents>(
  eventName: K,
  handler: (event: CoreEvents[K]) => void,
) {
  useEffect(() => {
    const unsubscribe = on(eventName, handler);
    return () => {
      unsubscribe();
    };
  }, [eventName, handler]);
}
