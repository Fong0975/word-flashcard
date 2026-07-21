interface CryptoLike {
  randomUUID?: () => string;
}

const ambientCrypto: CryptoLike | undefined =
  typeof crypto !== 'undefined' ? crypto : undefined;

// Module-level counter so the fallback below is unique across calls by
// construction, rather than relying solely on Math.random() entropy.
let fallbackCallCount = 0;

/**
 * Generates an opaque identifier for a single quiz attempt.
 *
 * Sent to the backend as `quiz_session_id` so it can tell a resubmission
 * (the user navigated back and re-rated a word already answered in this
 * attempt) apart from a genuinely new practice event. The value only needs
 * to be unique per attempt and fit the backend's 36-char column, not be a
 * strict RFC 4122 UUID, so a non-crypto fallback is safe when
 * `crypto.randomUUID` isn't available.
 *
 * `cryptoImpl` defaults to the ambient `crypto` global and only exists so
 * tests can pass a plain object in directly, instead of mutating the global
 * `crypto` for the duration of a test.
 */
export const generateQuizSessionId = (
  cryptoImpl: CryptoLike | undefined = ambientCrypto,
): string => {
  if (cryptoImpl && typeof cryptoImpl.randomUUID === 'function') {
    return cryptoImpl.randomUUID();
  }
  fallbackCallCount += 1;
  return `${Date.now().toString(36)}-${fallbackCallCount.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};
