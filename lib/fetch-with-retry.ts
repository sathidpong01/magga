/**
 * Fetch wrapper with automatic retry and exponential backoff
 */

interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

/**
 * Fetch with automatic retry on failure
 * @param url - URL to fetch
 * @param options - Fetch options with retry config
 * @returns Response
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // If response is OK or not in retryOn list, return it
      if (response.ok || !retryOn.includes(response.status)) {
        return response;
      }

      // If this was the last attempt, return the failed response
      if (attempt === retries) {
        return response;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(
        `Fetch failed with status ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(
        `Fetch error: ${lastError.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Fetch failed after all retries");
}

/**
 * JSON fetch with retry - convenience wrapper
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
