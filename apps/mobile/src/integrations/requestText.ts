/** Safe errors contain no URL, headers, credentials or server response. */
export class RequestTimeoutError extends Error {
  constructor() {
    super("Сервер не ответил вовремя. Повтори попытку.");
    this.name = "RequestTimeoutError";
  }
}
export class RequestCancelledError extends Error {
  constructor() {
    super("Запрос отменён");
    this.name = "RequestCancelledError";
  }
}
export class RequestNetworkError extends Error {
  constructor() {
    super("Нет соединения с сервером. Проверь сеть и повтори попытку.");
    this.name = "RequestNetworkError";
  }
}

/** Deadline includes the response body and still settles if the platform ignores abort. */
export async function requestText(
  url: string,
  init: RequestInit = {},
  options: {
    timeoutMs?: number;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<{ response: Response; text: string }> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error("Некорректный срок ожидания запроса");
  const parent = options.signal ?? init.signal;
  if (parent?.aborted) throw new RequestCancelledError();
  const controller = new AbortController();
  let stop: (error: Error) => void = () => undefined;
  const stopped = new Promise<never>((_, reject) => {
    stop = reject;
  });
  const cancel = () => {
    stop(new RequestCancelledError());
    controller.abort();
  };
  const timer = setTimeout(() => {
    stop(new RequestTimeoutError());
    controller.abort();
  }, timeoutMs);
  parent?.addEventListener("abort", cancel, { once: true });
  try {
    return await Promise.race([
      stopped,
      (async () => {
        try {
          const response = await (options.fetchImpl ?? fetch)(url, {
            ...init,
            signal: controller.signal,
          });
          const text = await response.text();
          return { response, text };
        } catch (e) {
          if (parent?.aborted) throw new RequestCancelledError();
          if (controller.signal.aborted) throw new RequestTimeoutError();
          throw new RequestNetworkError();
        }
      })(),
    ]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", cancel);
  }
}
