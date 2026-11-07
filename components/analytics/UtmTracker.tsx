'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureUtmParameters } from '@/lib/utm';

function UtmCaptureContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      captureUtmParameters(searchParams);
    }
  }, [searchParams]);

  return null;
}

export function UtmTracker() {
  return (
    <Suspense fallback={null}>
      <UtmCaptureContent />
    </Suspense>
  );
}
