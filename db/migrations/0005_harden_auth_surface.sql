ALTER POLICY "accounts_select_own" ON "accounts" TO authenticated USING (user_id = (SELECT private.current_user_id()));--> statement-breakpoint
ALTER POLICY "sessions_select_own" ON "sessions" TO authenticated USING (user_id = (SELECT private.current_user_id()));--> statement-breakpoint
REVOKE ALL ON TABLE "accounts" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "sessions" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "verification" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "verification_tokens" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "login_attempts" FROM anon, authenticated;--> statement-breakpoint
REVOKE SELECT ("email", "password", "ban_reason", "banned_at", "banned", "is_banned") ON TABLE "profiles" FROM anon, authenticated;
