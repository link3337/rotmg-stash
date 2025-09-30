// A minimal, dependable redux middleware to replace the unmaintained `redux-logger`.
// Logs action type, payload (if any), and next state in a compact format.
import type { Middleware } from '@reduxjs/toolkit';

export const simpleLogger: Middleware = (storeAPI) => (next) => (action: any) => {
  const actionType = String(action && action.type);
  const isErrorAction = /error|fail|rejected/i.test(actionType);

  const time =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const start = time;

  try {
    const prevState = storeAPI.getState();
    const result = next(action);

    const end =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const duration = Math.round((end - start) * 100) / 100; // ms, 2 decimals
    const nextState = storeAPI.getState();

    // Styled title similar to redux-logger
    const title = `action ${actionType}`;
    const typeStyle = `color: ${isErrorAction ? '#e53935' : '#1976d2'}; font-weight: 700`; // red for errors, blue otherwise
    const metaStyle = 'color: #9e9e9e; font-weight: 400';

    if (console.groupCollapsed) {
      try {
        console.groupCollapsed(
          `%c ${title} %c@ ${new Date().toLocaleTimeString()} %c(+${duration} ms)`,
          typeStyle,
          metaStyle,
          'color: #4caf50'
        );
      } catch (e) {
        // some consoles may not support CSS, fallback
        console.groupCollapsed(`${title} @ ${new Date().toLocaleTimeString()} (+${duration} ms)`);
      }

      // labeled logs with subtle colors
      try {
        console.log('%c Prev state', 'color: #9e9e9e; font-weight: 600', prevState);
        console.log('%c Action    ', 'color: #04a2fdff; font-weight: 600', action);
        console.log('%c Next state', 'color: #4caf50; font-weight: 600', nextState);
      } catch (e) {
        console.log('Prev state:', prevState);
        console.log('Action    :', action);
        console.log('Next state:', nextState);
      }

      console.groupEnd();
    } else {
      // fallback for environments without console.group
      console.log('[redux]', title, `@ ${new Date().toLocaleTimeString()}`, `(+${duration} ms)`);
      console.log('Prev state:', prevState);
      console.log('Action:', action);
      console.log('Next state:', nextState);
    }

    return result;
  } catch (err) {
    console.error('simpleLogger middleware error', err);
    return next(action);
  }
};

export default simpleLogger;
