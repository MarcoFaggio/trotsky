-- Session revocation.
--
-- `tokenVersion` is embedded in every access/refresh token as `ver`. Bumping it
-- invalidates all outstanding tokens for that user on their next server-side
-- check, which is what makes logout, password change, role change, and
-- deactivation actually terminate a session. Before this, a leaked refresh
-- cookie was a permanent, self-renewing login.
--
-- `disabledAt` soft-deactivates an account without deleting audit history
-- (decided revenue actions, inquiry messages, security events).

ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "disabledAt" TIMESTAMP(3);
