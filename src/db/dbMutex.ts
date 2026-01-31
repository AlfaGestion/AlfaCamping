let lock: Promise<void> = Promise.resolve();

export async function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });

  const wait = lock;
  lock = wait.then(() => next);

  await wait;
  try {
    return await fn();
  } finally {
    release();
  }
}
