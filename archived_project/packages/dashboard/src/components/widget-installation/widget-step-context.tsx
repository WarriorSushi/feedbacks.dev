"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const syncUrl = useCallback((nextStep: WidgetStep) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'widget-installation');
    params.set('widgetStep', nextStep);
    const url = `${window.location.pathname}?${params.toString()}`;
    router.replace(url, { scroll: false });
  }, [router, searchParams]);

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
      const next = normalizeStep(searchParams.get('widgetStep'));
      skipEffectRef.current = true;
      setStep(next, { skipUrl: true });
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [searchParams, setStep]);

  const value = useMemo<WidgetStepContextValue>(() => ({
    step,
    setStep,
  }), [setStep, step]);

  return <WidgetStepContext.Provider value={value}>{children}</WidgetStepContext.Provider>;
}

export function useWidgetStepContext(): WidgetStepContextValue | undefined {
  return useContext(WidgetStepContext);
}
