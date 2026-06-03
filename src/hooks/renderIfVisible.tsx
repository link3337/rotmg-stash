import React, { useEffect, useMemo, useRef, useState } from 'react';

interface RenderIfVisibleProps {
  /**
   * Whether the element should be visible initially or not.
   * Useful e.g. for always setting the first N items to visible.
   * Default: false
   */
  initialVisible?: boolean;
  /** An estimate of the element's height */
  defaultHeight?: number;
  /** How far outside the viewport in pixels should elements be considered visible?  */
  visibleOffset?: number;
  /** Should the element stay rendered after it becomes visible? */
  keepRendered?: boolean;
  root?: HTMLElement | null;
  /** E.g. 'span', 'tbody'. Default = 'div' */
  rootElement?: string;
  rootElementClass?: string;
  /** E.g. 'span', 'tr'. Default = 'div' */
  placeholderElement?: string;
  placeholderElementClass?: string;
  children: React.ReactNode;
}

const RenderIfVisible: React.FC<RenderIfVisibleProps> = ({
  initialVisible = false,
  defaultHeight = 1500,
  visibleOffset = 5000,
  keepRendered = false,
  root = null,
  rootElement = 'div',
  rootElementClass = '',
  placeholderElement = 'div',
  placeholderElementClass = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(initialVisible);
  const wasVisible = useRef<boolean>(initialVisible);
  const isVisibleRef = useRef<boolean>(initialVisible);
  const placeholderHeight = useRef<number>(defaultHeight);
  const intersectionRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const idleCallbackIdRef = useRef<number | null>(null);

  // Set visibility with intersection observer
  useEffect(() => {
    if (!intersectionRef.current) {
      return undefined;
    }

    const localRef = intersectionRef.current;

    const updateVisibility = (nextVisible: boolean) => {
      if (nextVisible === isVisibleRef.current) {
        return;
      }

      isVisibleRef.current = nextVisible;

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleCallbackIdRef.current = window.requestIdleCallback(
          () => {
            setIsVisible(nextVisible);
          },
          { timeout: 600 }
        );
        return;
      }

      setIsVisible(nextVisible);
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        // Before switching off `isVisible`, set the height of the placeholder.
        if (!entry.isIntersecting) {
          placeholderHeight.current = localRef.offsetHeight;
        }

        updateVisibility(entry.isIntersecting);
      },
      { root, rootMargin: `${visibleOffset}px 0px ${visibleOffset}px 0px` }
    );

    observerRef.current.observe(localRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(localRef);
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (
        idleCallbackIdRef.current !== null &&
        typeof window !== 'undefined' &&
        'cancelIdleCallback' in window
      ) {
        window.cancelIdleCallback(idleCallbackIdRef.current);
        idleCallbackIdRef.current = null;
      }
    };
  }, [root, visibleOffset]);

  useEffect(() => {
    if (isVisible) {
      wasVisible.current = true;

      // If content should stay mounted, we can stop observing after first reveal.
      if (keepRendered && observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
  }, [isVisible, keepRendered]);

  const placeholderStyle = { height: placeholderHeight.current };
  const rootClasses = useMemo(() => `renderIfVisible ${rootElementClass}`, [rootElementClass]);
  const placeholderClasses = useMemo(
    () => `renderIfVisible-placeholder ${placeholderElementClass}`,
    [placeholderElementClass]
  );

  return React.createElement(rootElement, {
    children:
      isVisible || (keepRendered && wasVisible.current) ? (
        <>{children}</>
      ) : (
        React.createElement(placeholderElement, {
          className: placeholderClasses,
          style: placeholderStyle
        })
      ),
    ref: intersectionRef,
    className: rootClasses
  });
};

export default RenderIfVisible;
