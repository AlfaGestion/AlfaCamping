import * as Print from "expo-print";

const ENV_QUEUE_DELAY = Number(process.env.EXPO_PUBLIC_PRINT_QUEUE_DELAY_MS);
const ENV_RETRY_DELAY = Number(process.env.EXPO_PUBLIC_PRINT_RETRY_DELAY_MS);
const ENV_RETRIES = Number(process.env.EXPO_PUBLIC_PRINT_RETRIES);

const DEFAULT_QUEUE_DELAY_MS = Number.isFinite(ENV_QUEUE_DELAY) && ENV_QUEUE_DELAY >= 0 ? ENV_QUEUE_DELAY : 1200;
const DEFAULT_RETRY_DELAY_MS = Number.isFinite(ENV_RETRY_DELAY) && ENV_RETRY_DELAY >= 0 ? ENV_RETRY_DELAY : 1500;
const DEFAULT_RETRIES = Number.isFinite(ENV_RETRIES) && ENV_RETRIES >= 0 ? ENV_RETRIES : 1;

let queueChain = Promise.resolve();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetry = async (job, { retries, retryDelayMs }) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await job();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await wait(retryDelayMs);
      }
    }
  }
  throw lastError;
};

export const enqueuePrintJob = async (job, options = {}) => {
  const queueDelayMs = Number.isFinite(Number(options.queueDelayMs))
    ? Number(options.queueDelayMs)
    : DEFAULT_QUEUE_DELAY_MS;
  const retryDelayMs = Number.isFinite(Number(options.retryDelayMs))
    ? Number(options.retryDelayMs)
    : DEFAULT_RETRY_DELAY_MS;
  const retries = Number.isFinite(Number(options.retries))
    ? Number(options.retries)
    : DEFAULT_RETRIES;

  const run = async () => {
    try {
      return await runWithRetry(job, { retries, retryDelayMs });
    } finally {
      if (queueDelayMs > 0) {
        await wait(queueDelayMs);
      }
    }
  };

  const task = queueChain.then(run, run);
  queueChain = task.catch(() => undefined);
  return task;
};

export const printHtmlQueued = (html, options = {}) =>
  enqueuePrintJob(() => Print.printAsync({ html }), options);

export const printToFileQueued = (html, options = {}) =>
  enqueuePrintJob(
    () =>
      Print.printToFileAsync({
        html,
        base64: false,
      }),
    options
  );
