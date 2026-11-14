/** Keep wipe after every in-flight widget write; one failure must not block later cleanup. */
export function createSerialWidgetWrites() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(job: () => Promise<T>): Promise<T> {
      const next = tail.then(job, job);
      tail = next.catch(() => undefined);
      return next;
    },
  };
}
