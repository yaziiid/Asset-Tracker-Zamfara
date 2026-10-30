const RESEND_DELAY = 60_000;
const THROTTLE_DELAY = 5 * 60_000;

// Lives above the sign-up screen so its result survives the Auth state change.
export function createVerificationSender({
  deliver,
  storage,
  onChange,
  now = Date.now,
}) {
  const pending = new Set();
  const key = (uid) => `save80:verification-retry:${uid}`;
  const retryAt = (uid) => {
    try {
      const value = Number(storage?.getItem(key(uid)));
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  };
  function remember(uid, value) {
    try {
      storage?.setItem(key(uid), String(value));
    } catch {
      /* Storage is optional. */
    }
  }
  return {
    retryAt,
    async send(user) {
      const uid = user.uid;
      if (pending.has(uid)) return false;
      let nextAttempt = retryAt(uid);
      if (nextAttempt > now()) {
        onChange({
          uid,
          busy: false,
          retryAt: nextAttempt,
          error:
            "Please wait for the resend timer before requesting another email.",
        });
        return false;
      }
      pending.add(uid);
      nextAttempt = now() + RESEND_DELAY;
      remember(uid, nextAttempt);
      onChange({ uid, busy: true, retryAt: nextAttempt });
      try {
        await deliver(user);
        onChange({
          uid,
          busy: false,
          retryAt: nextAttempt,
          status:
            "Verification email requested. Check your inbox and spam folder. Use the latest email if you receive more than one.",
        });
        return true;
      } catch (error) {
        const throttled = [
          "auth/too-many-requests",
          "auth/quota-exceeded",
        ].includes(error.code);
        nextAttempt = now() + (throttled ? THROTTLE_DELAY : RESEND_DELAY);
        remember(uid, nextAttempt);
        onChange({
          uid,
          busy: false,
          retryAt: nextAttempt,
          error: throttled
            ? "Firebase has temporarily limited verification requests. Wait before trying again; the limit may last longer than the timer. If an email already arrived, you can still use its link."
            : "The verification email could not be requested. Check your connection and retry after the timer. Your account has been created, so you do not need to sign up again.",
        });
        return false;
      } finally {
        pending.delete(uid);
      }
    },
  };
}
