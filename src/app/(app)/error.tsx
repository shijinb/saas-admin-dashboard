"use client";

import { Alert, buttonStyles } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl space-y-4">
      <Alert>
        Something went wrong while loading this page. If the API is down, check that it is running and that API_URL points to it.
        {error.digest && <span className="mt-1 block text-xs">Reference: {error.digest}</span>}
      </Alert>
      <button type="button" onClick={reset} className={buttonStyles.secondary}>
        Try again
      </button>
    </div>
  );
}
