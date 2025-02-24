import { useEffect, useState } from 'react';

/**
 * Custom hook that debounces a value by a specified delay.
 *
 * @param value - The value to debounce.
 * @param delay - The delay in milliseconds to debounce the value.
 * @returns The debounced value.
 *
 * @example
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 */
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
