import { useEffect } from 'react';

export function usePreventUnload(shouldPrevent: boolean) {
  useEffect(() => {
    if (!shouldPrevent) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Setting returnValue to any string triggers the browser's prompt.
      // Modern browsers ignore the specific string and show a generic message.
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldPrevent]);
}
