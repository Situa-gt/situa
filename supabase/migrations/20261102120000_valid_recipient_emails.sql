-- Lead recipients must be well-formed: Brevo rejects the whole send when one address is malformed.
-- On 01-11-2026 a project contact ending in a dot ("...@alinea.gt.") stopped a FORESTI lead from
-- reaching anyone. Same pattern as the site and the admin: no leading, trailing or double dots.

create or replace function public.is_valid_email(email text)
returns boolean
language sql
immutable
as $$
  select email ~ '^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$'
$$;

create or replace function public.are_valid_emails(emails text[])
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(public.is_valid_email(email)), true) from unnest(emails) as email
$$;

-- Existing addresses with stray spaces (the send already trimmed them).
update public.developers set contact_email = btrim(contact_email)
where contact_email is not null and contact_email <> btrim(contact_email);
update public.developers set notification_emails = array(select btrim(email) from unnest(notification_emails) as email)
where notification_emails is not null
  and exists (select 1 from unnest(notification_emails) as email where email <> btrim(email));
update public.project_contacts set email = btrim(email) where email <> btrim(email);

alter table public.project_contacts
  add constraint project_contacts_email_valid check (public.is_valid_email(email));
alter table public.developers
  add constraint developers_contact_email_valid
    check (contact_email is null or contact_email = '' or public.is_valid_email(contact_email));
alter table public.developers
  add constraint developers_notification_emails_valid
    check (notification_emails is null or public.are_valid_emails(notification_emails));
