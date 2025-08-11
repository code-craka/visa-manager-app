import { useEffect, useRef } from 'react';

export const useMemoryCleanup = () => {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const listenersRef = useRef<Array<{ element: any; event: string; handler: any }>>([]);

  const addTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  };

  const addInterval = (callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.push(interval);
    return interval;
  };

  const addEventListener = (element: any, event: string, handler: any) => {
    element.addEventListener(event, handler);
    listenersRef.current.push({ element, event, handler });
  };

  useEffect(() => {
    return () => {
      // Clear timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      // Clear intervals
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];

      // Remove event listeners
      listenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      listenersRef.current = [];
    };
  }, []);

  return { addTimeout, addInterval, addEventListener };
};