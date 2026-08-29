-- Record of the RLS policies applied to the linked Supabase project.
--
-- NOT a migration (this project is not migration-managed — schema lives in the
-- dashboard). This file exists so the intended policy state is reviewable in
-- git. Applied 2026-08-29 via `supabase db query --linked -f`.
--
-- WHY: before this, `valuation_requests` carried a policy
--   "Service role can manage valuation_requests" FOR ALL TO public USING (true)
-- Because its TO clause was PUBLIC (not service_role), it applied to the `anon`
-- role too — so anyone holding NEXT_PUBLIC_SUPABASE_ANON_KEY (which ships in the
-- browser bundle) could SELECT/UPDATE/DELETE every valuation request. Verified
-- by `set local role anon; select count(*) from valuation_requests;` → returned
-- rows. The service role bypasses RLS entirely, so that policy was never needed.
--
-- The remaining admin policies previously granted the whole `authenticated`
-- role, which made security depend on Supabase signups being disabled in the
-- dashboard. They now check the JWT email claim instead, so an unexpected
-- signup cannot read leads or edit content.

-- Single source of truth for who is an admin at the database level.
-- Keep in sync with the ADMIN_EMAILS env var used by requireAdmin().
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public, auth
as $fn$
  select coalesce(auth.jwt() ->> 'email', '') = any (array['info@mcgowanlettings.co.uk'])
$fn$;

-- valuation_requests -------------------------------------------------------
drop policy if exists "Service role can manage valuation_requests" on public.valuation_requests;
drop policy if exists "Authenticated users can read valuation_requests" on public.valuation_requests;
drop policy if exists "Authenticated users can update valuation_requests" on public.valuation_requests;
drop policy if exists "Authenticated users can delete valuation_requests" on public.valuation_requests;
create policy "Admins can read valuation_requests"   on public.valuation_requests for select to authenticated using (public.is_admin());
create policy "Admins can update valuation_requests" on public.valuation_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete valuation_requests" on public.valuation_requests for delete to authenticated using (public.is_admin());

-- contact_submissions ------------------------------------------------------
-- The old "Anon can submit contact form" INSERT policy is dropped: the contact
-- action inserts via supabaseAdmin (service role, bypasses RLS), so nothing used
-- it, while it let anyone holding the anon key POST rows straight into David's
-- inbox, bypassing the honeypot and server-side validation. Verified: anon
-- insert now fails with 42501, service-role insert still succeeds.
drop policy if exists "Anon can submit contact form" on public.contact_submissions;
drop policy if exists "Authenticated full access to submissions" on public.contact_submissions;
create policy "Admins can read contact_submissions"   on public.contact_submissions for select to authenticated using (public.is_admin());
create policy "Admins can update contact_submissions" on public.contact_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete contact_submissions" on public.contact_submissions for delete to authenticated using (public.is_admin());

-- tenant_applications ------------------------------------------------------
-- Inserts are service-role only (the public /apply action uses supabaseAdmin).
drop policy if exists "Authenticated users can read tenant_applications" on public.tenant_applications;
drop policy if exists "Authenticated users can update tenant_applications" on public.tenant_applications;
drop policy if exists "Authenticated users can delete tenant_applications" on public.tenant_applications;
create policy "Admins can read tenant_applications"   on public.tenant_applications for select to authenticated using (public.is_admin());
create policy "Admins can update tenant_applications" on public.tenant_applications for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete tenant_applications" on public.tenant_applications for delete to authenticated using (public.is_admin());

-- properties / blog_posts --------------------------------------------------
-- Public read policies (active = true / published = true) are left untouched.
drop policy if exists "Authenticated full access to properties" on public.properties;
create policy "Admins can manage properties" on public.properties for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts" on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());
