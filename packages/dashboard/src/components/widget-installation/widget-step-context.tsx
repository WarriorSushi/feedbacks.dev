"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetStep } from './widget-installation';

const STEP_ORDER: WidgetStep[] = ['setup', 'appearance', 'fields', 'protection', 'publish'];

interface WidgetStepContextValue {
  step: WidgetStep;
  setStep: (step: WidgetStep, options?: { skipUrl?: boolean }) => void;
}

const WidgetStepContext = createContext<WidgetStepContextValue | undefined>(undefined);

function normalizeStep(step: string | null | undefined): WidgetStep {
  if (step && (STEP_ORDER as string[]).includes(step)) {
    return step as WidgetStep;
  }
  return 'setup';
}

export function WidgetStepProvider({ initialStep, children }: { initialStep: WidgetStep; children: React.ReactNode }) {
  const [step, setStepState] = useState<WidgetStep>(initialStep);
  const skipEffectRef = useRef(false);

  const syncUrl = useCallback((nextStep: WidgetStep) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('section', 'widget-installation');
    params.set('widgetStep', nextStep);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, []);

  const setStep = useCallback((nextStep: WidgetStep, options?: { skipUrl?: boolean }) => {
    setStepState((prev) => {
      if (prev === nextStep) {
        return prev;
      }
      return nextStep;
    });
    if (!options?.skipUrl) {
      syncUrl(nextStep);
    }
  }, [syncUrl]);

  useEffect(() => {
    if (skipEffectRef.current) {
      skipEffectRef.current = false;
      return;
    }
    setStepState(initialStep);
  }, [initialStep]);

  useEffect(() => {
    const handlePopstate = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const next = normalizeStep(params.get('widgetStep'));
      skipEffectRef.current = true;
      setStep(next, { skipUrl: true });
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [setStep]);

  const value = useMemo<WidgetStepContextValue>(() => ({
    step,
    setStep,
  }), [setStep, step]);

  return <WidgetStepContext.Provider value={value}>{children}</WidgetStepContext.Provider>;
}

export function useWidgetStepContext(): WidgetStepContextValue | undefined {
  return useContext(WidgetStepContext);
}
