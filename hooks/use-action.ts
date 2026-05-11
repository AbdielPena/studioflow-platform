"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/packages/lib/errors";

type Options<T> = {
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
  successMessage?: string;
  silent?: boolean;
};

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options: Options<TOutput> = {},
) {
  const [isPending, startTransition] = useTransition();

  const run = useCallback(
    (input: TInput) =>
      new Promise<ActionResult<TOutput>>((resolve) => {
        startTransition(async () => {
          const result = await action(input);
          if (result.ok) {
            if (!options.silent && options.successMessage) {
              toast.success(options.successMessage);
            }
            options.onSuccess?.(result.data);
          } else {
            if (!options.silent) {
              toast.error(result.error.message);
            }
            options.onError?.(result.error.message);
          }
          resolve(result);
        });
      }),
    [action, options],
  );

  return { run, isPending };
}
