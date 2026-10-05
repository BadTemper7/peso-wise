-- PesoWise complete Supabase schema
-- Run through the Supabase CLI (`supabase db push`) or paste into the SQL editor once.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.invitation_status as enum ('pending', 'accepted', 'declined', 'expired');
create type public.wallet_type as enum ('cash', 'ewallet', 'debit', 'credit');
create type public.transaction_type as enum ('income', 'expense', 'transfer');
create type public.category_type as enum ('income', 'expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text,
  currency text not null default 'PHP' check (char_length(currency) = 3),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  settings jsonb not null default '{"member_can_manage_wallets": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create unique index one_owner_per_workspace on public.workspace_members(workspace_id) where role = 'owner';

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email citext not null,
  role public.workspace_role not null default 'member' check (role <> 'owner'),
  status public.invitation_status not null default 'pending',
  token uuid not null default gen_random_uuid(),
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_pending_invite_per_email on public.workspace_invitations(workspace_id, lower(email::text)) where status = 'pending';

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  type public.wallet_type not null,
  initial_balance numeric(16,2) not null default 0,
  current_balance numeric(16,2) not null default 0,
  currency text not null default 'PHP' check (char_length(currency) = 3),
  is_archived boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  type public.category_type not null,
  icon text,
  color text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, type, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete restrict,
  type public.transaction_type not null,
  amount numeric(16,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete restrict,
  description text not null default '',
  transaction_date date not null default current_date,
  from_wallet_id uuid references public.wallets(id) on delete restrict,
  to_wallet_id uuid references public.wallets(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_transaction_shape check (
    (type in ('income', 'expense') and wallet_id is not null and from_wallet_id is null and to_wallet_id is null and category_id is not null)
    or
    (type = 'transfer' and wallet_id is null and from_wallet_id is not null and to_wallet_id is not null and from_wallet_id <> to_wallet_id and category_id is null)
  )
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  month_start date not null check (date_trunc('month', month_start)::date = month_start),
  limit_amount numeric(16,2) not null check (limit_amount > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, category_id, month_start)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_workspace_members_user on public.workspace_members(user_id);
create index idx_invitations_email_status on public.workspace_invitations(lower(email::text), status);
create index idx_wallets_workspace_active on public.wallets(workspace_id, is_archived);
create index idx_transactions_workspace_date on public.transactions(workspace_id, transaction_date desc);
create index idx_transactions_wallet on public.transactions(wallet_id, transaction_date desc);
create index idx_transactions_from_wallet on public.transactions(from_wallet_id, transaction_date desc);
create index idx_transactions_to_wallet on public.transactions(to_wallet_id, transaction_date desc);
create index idx_transactions_created_by on public.transactions(created_by);
create index idx_categories_workspace_type on public.categories(workspace_id, type, is_archived);
create index idx_budgets_workspace_month on public.budgets(workspace_id, month_start);
create index idx_activity_workspace_created on public.activity_logs(workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger invitations_updated_at before update on public.workspace_invitations for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

create or replace function public.workspace_role_for(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns public.workspace_role
language sql
stable
security definer set search_path = public
as $$
  select wm.role from public.workspace_members wm
  where wm.workspace_id = p_workspace_id and wm.user_id = p_user_id
  limit 1;
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id and wm.user_id = p_user_id
  );
$$;

create or replace function public.has_workspace_role(p_workspace_id uuid, p_roles public.workspace_role[], p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(public.workspace_role_for(p_workspace_id, p_user_id) = any(p_roles), false);
$$;

create or replace function public.shares_workspace_with(p_other_user uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists(
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = p_other_user
  );
$$;

create or replace function public.member_can_manage_wallets(p_workspace_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select case
    when public.has_workspace_role(p_workspace_id, array['owner','admin']::public.workspace_role[]) then true
    when public.workspace_role_for(p_workspace_id) = 'member' then
      coalesce((select (settings ->> 'member_can_manage_wallets')::boolean from public.workspaces where id = p_workspace_id), false)
    else false
  end;
$$;

create or replace function public.create_workspace(
  workspace_name text,
  workspace_description text default null,
  workspace_currency text default 'PHP'
)
returns public.workspaces
language plpgsql
security definer set search_path = public
as $$
declare
  v_workspace public.workspaces;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(workspace_name)) < 2 then raise exception 'Workspace name is too short'; end if;

  insert into public.profiles (id, email, full_name)
  select id, email, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
  from auth.users where id = auth.uid()
  on conflict (id) do nothing;

  insert into public.workspaces (name, description, currency, owner_id)
  values (trim(workspace_name), nullif(trim(workspace_description), ''), upper(workspace_currency), auth.uid())
  returning * into v_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace.id, auth.uid(), 'owner');

  insert into public.categories (workspace_id, name, type, icon, color, is_default, created_by) values
    (v_workspace.id, 'Food', 'expense', 'coffee', '#f97316', true, auth.uid()),
    (v_workspace.id, 'Transportation', 'expense', 'truck', '#3b82f6', true, auth.uid()),
    (v_workspace.id, 'Bills', 'expense', 'zap', '#f59e0b', true, auth.uid()),
    (v_workspace.id, 'Shopping', 'expense', 'shopping-bag', '#8b5cf6', true, auth.uid()),
    (v_workspace.id, 'Entertainment', 'expense', 'film', '#ec4899', true, auth.uid()),
    (v_workspace.id, 'Health', 'expense', 'heart', '#ef4444', true, auth.uid()),
    (v_workspace.id, 'Education', 'expense', 'book', '#6366f1', true, auth.uid()),
    (v_workspace.id, 'Housing', 'expense', 'home', '#14b8a6', true, auth.uid()),
    (v_workspace.id, 'Other Expense', 'expense', 'more-horizontal', '#64748b', true, auth.uid()),
    (v_workspace.id, 'Salary', 'income', 'briefcase', '#10b981', true, auth.uid()),
    (v_workspace.id, 'Freelance', 'income', 'monitor', '#06b6d4', true, auth.uid()),
    (v_workspace.id, 'Business', 'income', 'trending-up', '#0ea5e9', true, auth.uid()),
    (v_workspace.id, 'Bonus', 'income', 'gift', '#84cc16', true, auth.uid()),
    (v_workspace.id, 'Investment', 'income', 'bar-chart-2', '#22c55e', true, auth.uid()),
    (v_workspace.id, 'Other Income', 'income', 'plus-circle', '#64748b', true, auth.uid());

  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (v_workspace.id, auth.uid(), 'created', 'workspace', v_workspace.id, jsonb_build_object('name', v_workspace.name));

  return v_workspace;
end;
$$;

create or replace function public.invite_workspace_member(p_workspace_id uuid, p_email text, p_role public.workspace_role default 'member')
returns public.workspace_invitations
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite public.workspace_invitations;
  v_email citext := lower(trim(p_email))::citext;
  v_existing_user uuid;
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin']::public.workspace_role[]) then
    raise exception 'Permission denied';
  end if;
  if p_role = 'owner' then raise exception 'Use ownership transfer instead'; end if;
  if v_email::text !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Invalid email address'; end if;

  select id into v_existing_user from public.profiles where lower(email::text) = lower(v_email::text) limit 1;
  if v_existing_user is not null and public.is_workspace_member(p_workspace_id, v_existing_user) then
    raise exception 'User is already a workspace member';
  end if;

  update public.workspace_invitations set status = 'expired'
  where workspace_id = p_workspace_id and lower(email::text) = lower(v_email::text)
    and status = 'pending' and expires_at <= now();

  select * into v_invite
  from public.workspace_invitations
  where workspace_id = p_workspace_id
    and lower(email::text) = lower(v_email::text)
    and status = 'pending'
  for update;

  if found then
    update public.workspace_invitations
      set role = p_role,
          invited_by = auth.uid(),
          expires_at = now() + interval '7 days',
          updated_at = now()
      where id = v_invite.id
      returning * into v_invite;
  else
    insert into public.workspace_invitations (workspace_id, email, role, invited_by)
    values (p_workspace_id, v_email, p_role, auth.uid())
    returning * into v_invite;
  end if;

  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (p_workspace_id, auth.uid(), 'invited', 'member', v_invite.id, jsonb_build_object('email', v_email::text, 'role', p_role::text));

  return v_invite;
end;
$$;

create or replace function public.accept_workspace_invitation(p_invitation_id uuid)
returns public.workspace_members
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite public.workspace_invitations;
  v_member public.workspace_members;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  select * into v_invite from public.workspace_invitations where id = p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  if v_invite.status <> 'pending' then raise exception 'Invitation is no longer pending'; end if;
  if v_invite.expires_at <= now() then
    update public.workspace_invitations set status = 'expired' where id = p_invitation_id;
    raise exception 'Invitation has expired';
  end if;
  if lower(v_invite.email::text) <> v_email then raise exception 'Invitation email does not match this account'; end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role
  returning * into v_member;

  update public.workspace_invitations set status = 'accepted', accepted_at = now() where id = p_invitation_id;
  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (v_invite.workspace_id, auth.uid(), 'joined', 'workspace', v_invite.workspace_id, jsonb_build_object('role', v_invite.role::text));
  return v_member;
end;
$$;

create or replace function public.decline_workspace_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  update public.workspace_invitations set status = 'declined'
  where id = p_invitation_id and status = 'pending' and lower(email::text) = v_email;
  if not found then raise exception 'Invitation not found or permission denied'; end if;
end;
$$;

create or replace function public.cancel_workspace_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_workspace_id uuid;
begin
  select workspace_id into v_workspace_id from public.workspace_invitations where id = p_invitation_id;
  if not public.has_workspace_role(v_workspace_id, array['owner','admin']::public.workspace_role[]) then raise exception 'Permission denied'; end if;
  delete from public.workspace_invitations where id = p_invitation_id and status = 'pending';
end;
$$;

create or replace function public.change_workspace_member_role(p_workspace_id uuid, p_user_id uuid, p_role public.workspace_role)
returns public.workspace_members language plpgsql security definer set search_path = public as $$
declare v_member public.workspace_members;
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin']::public.workspace_role[]) then raise exception 'Permission denied'; end if;
  if p_role = 'owner' then raise exception 'Use transfer ownership'; end if;
  if public.workspace_role_for(p_workspace_id, p_user_id) = 'owner' then raise exception 'Cannot change owner role'; end if;
  if public.workspace_role_for(p_workspace_id) = 'admin' and p_role = 'admin' then raise exception 'Only the owner can promote admins'; end if;
  update public.workspace_members set role = p_role where workspace_id = p_workspace_id and user_id = p_user_id returning * into v_member;
  if not found then raise exception 'Member not found'; end if;
  return v_member;
end;
$$;

create or replace function public.remove_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin']::public.workspace_role[]) then raise exception 'Permission denied'; end if;
  if public.workspace_role_for(p_workspace_id, p_user_id) = 'owner' then raise exception 'The owner cannot be removed'; end if;
  if public.workspace_role_for(p_workspace_id) = 'admin' and public.workspace_role_for(p_workspace_id, p_user_id) = 'admin' then raise exception 'Only the owner can remove an admin'; end if;
  delete from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id;
end;
$$;

create or replace function public.transfer_workspace_ownership(p_workspace_id uuid, p_new_owner_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.workspace_role_for(p_workspace_id) <> 'owner' then raise exception 'Only the owner can transfer ownership'; end if;
  if not public.is_workspace_member(p_workspace_id, p_new_owner_id) then raise exception 'New owner must already be a member'; end if;
  update public.workspace_members set role = 'admin' where workspace_id = p_workspace_id and user_id = auth.uid();
  update public.workspace_members set role = 'owner' where workspace_id = p_workspace_id and user_id = p_new_owner_id;
  update public.workspaces set owner_id = p_new_owner_id where id = p_workspace_id;
end;
$$;

create or replace function public.leave_workspace(p_workspace_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.workspace_role_for(p_workspace_id) = 'owner' then raise exception 'Transfer ownership before leaving'; end if;
  delete from public.workspace_members where workspace_id = p_workspace_id and user_id = auth.uid();
end;
$$;

create or replace function public.validate_transaction_references()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.wallet_id is not null and not exists(select 1 from public.wallets where id = new.wallet_id and workspace_id = new.workspace_id and not is_archived) then raise exception 'Wallet does not belong to workspace'; end if;
  if new.from_wallet_id is not null and not exists(select 1 from public.wallets where id = new.from_wallet_id and workspace_id = new.workspace_id and not is_archived) then raise exception 'Source wallet does not belong to workspace'; end if;
  if new.to_wallet_id is not null and not exists(select 1 from public.wallets where id = new.to_wallet_id and workspace_id = new.workspace_id and not is_archived) then raise exception 'Destination wallet does not belong to workspace'; end if;
  if new.category_id is not null and not exists(select 1 from public.categories where id = new.category_id and workspace_id = new.workspace_id and type::text = new.type::text and not is_archived) then raise exception 'Category does not belong to workspace or type does not match'; end if;
  new.updated_by = auth.uid();
  return new;
end;
$$;
create trigger validate_transaction before insert or update on public.transactions for each row execute function public.validate_transaction_references();


create or replace function public.initialize_wallet_balance()
returns trigger language plpgsql as $$
begin
  new.current_balance := new.initial_balance;
  return new;
end;
$$;
create trigger wallet_initial_balance before insert on public.wallets for each row execute function public.initialize_wallet_balance();

create or replace function public.validate_budget_reference()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.categories
    where id = new.category_id
      and workspace_id = new.workspace_id
      and type = 'expense'
      and not is_archived
  ) then
    raise exception 'Budget category must be an active expense category in the same workspace';
  end if;
  return new;
end;
$$;
create trigger validate_budget before insert or update on public.budgets for each row execute function public.validate_budget_reference();

create or replace function public.apply_transaction_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_multiplier numeric;
begin
  if tg_op in ('UPDATE','DELETE') then
    if old.type = 'income' then update public.wallets set current_balance = current_balance - old.amount where id = old.wallet_id;
    elsif old.type = 'expense' then update public.wallets set current_balance = current_balance + old.amount where id = old.wallet_id;
    else
      update public.wallets set current_balance = current_balance + old.amount where id = old.from_wallet_id;
      update public.wallets set current_balance = current_balance - old.amount where id = old.to_wallet_id;
    end if;
  end if;
  if tg_op in ('INSERT','UPDATE') then
    if new.type = 'income' then update public.wallets set current_balance = current_balance + new.amount where id = new.wallet_id;
    elsif new.type = 'expense' then update public.wallets set current_balance = current_balance - new.amount where id = new.wallet_id;
    else
      update public.wallets set current_balance = current_balance - new.amount where id = new.from_wallet_id;
      update public.wallets set current_balance = current_balance + new.amount where id = new.to_wallet_id;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger transaction_balance after insert or update or delete on public.transactions for each row execute function public.apply_transaction_balance();

create or replace function public.create_transfer(p_workspace_id uuid, p_from_wallet_id uuid, p_to_wallet_id uuid, p_amount numeric, p_description text default '', p_transaction_date date default current_date)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare v_transaction public.transactions;
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin','member']::public.workspace_role[]) then raise exception 'Permission denied'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  insert into public.transactions (workspace_id, type, amount, description, transaction_date, from_wallet_id, to_wallet_id, created_by, updated_by)
  values (p_workspace_id, 'transfer', p_amount, coalesce(p_description,''), p_transaction_date, p_from_wallet_id, p_to_wallet_id, auth.uid(), auth.uid())
  returning * into v_transaction;
  return v_transaction;
end;
$$;

create or replace function public.prevent_wallet_delete_with_transactions()
returns trigger language plpgsql as $$
begin
  if exists(select 1 from public.transactions where wallet_id = old.id or from_wallet_id = old.id or to_wallet_id = old.id) then
    raise exception 'Wallet has transactions. Archive it instead.';
  end if;
  return old;
end;
$$;
create trigger prevent_wallet_delete before delete on public.wallets for each row execute function public.prevent_wallet_delete_with_transactions();

create or replace function public.log_financial_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_workspace_id uuid;
  v_entity_id uuid;
  v_action text;
  v_metadata jsonb := '{}'::jsonb;
begin
  v_action := case when tg_op = 'INSERT' then 'created' when tg_op = 'UPDATE' then 'updated' else 'deleted' end;

  if tg_op = 'DELETE' then
    v_workspace_id := old.workspace_id;
    v_entity_id := old.id;
    if tg_table_name = 'wallets' then
      v_metadata := jsonb_build_object('name', old.name, 'type', old.type::text);
    elsif tg_table_name = 'transactions' then
      v_metadata := jsonb_build_object('type', old.type::text, 'description', left(old.description, 80));
    elsif tg_table_name = 'budgets' then
      v_metadata := jsonb_build_object('month', old.month_start);
    end if;
  else
    v_workspace_id := new.workspace_id;
    v_entity_id := new.id;
    if tg_table_name = 'wallets' then
      v_metadata := jsonb_build_object('name', new.name, 'type', new.type::text);
    elsif tg_table_name = 'transactions' then
      v_metadata := jsonb_build_object('type', new.type::text, 'description', left(new.description, 80));
    elsif tg_table_name = 'budgets' then
      v_metadata := jsonb_build_object('month', new.month_start);
    end if;
  end if;

  insert into public.activity_logs(workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (v_workspace_id, auth.uid(), v_action, lower(tg_table_name), v_entity_id, v_metadata);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger wallet_activity after insert or update or delete on public.wallets for each row execute function public.log_financial_activity();
create trigger transaction_activity after insert or update or delete on public.transactions for each row execute function public.log_financial_activity();
create trigger budget_activity after insert or update or delete on public.budgets for each row execute function public.log_financial_activity();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.activity_logs enable row level security;

create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.shares_workspace_with(id)
  or exists (
    select 1 from public.workspace_invitations wi
    where wi.invited_by = profiles.id
      and lower(wi.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and wi.status = 'pending'
      and wi.expires_at > now()
  )
);
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy workspaces_select on public.workspaces for select using (
  public.is_workspace_member(id)
  or exists (
    select 1 from public.workspace_invitations wi
    where wi.workspace_id = workspaces.id
      and lower(wi.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and wi.status = 'pending'
      and wi.expires_at > now()
  )
);
create policy workspaces_update on public.workspaces for update using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
create policy workspaces_delete on public.workspaces for delete using (public.workspace_role_for(id) = 'owner');

create policy members_select on public.workspace_members for select using (public.is_workspace_member(workspace_id));

create policy invitations_select on public.workspace_invitations for select using (
  public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy wallets_select on public.wallets for select using (public.is_workspace_member(workspace_id));
create policy wallets_insert on public.wallets for insert with check (public.member_can_manage_wallets(workspace_id) and created_by = auth.uid());
create policy wallets_update on public.wallets for update using (public.member_can_manage_wallets(workspace_id)) with check (public.member_can_manage_wallets(workspace_id));
create policy wallets_delete on public.wallets for delete using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy categories_select on public.categories for select using (public.is_workspace_member(workspace_id));
create policy categories_insert on public.categories for insert with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]) and created_by = auth.uid());
create policy categories_update on public.categories for update using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy categories_delete on public.categories for delete using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy transactions_select on public.transactions for select using (public.is_workspace_member(workspace_id));
create policy transactions_insert on public.transactions for insert with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member']::public.workspace_role[])
  and created_by = auth.uid()
);
create policy transactions_update on public.transactions for update using (
  public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
  or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
) with check (
  public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
  or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
);
create policy transactions_delete on public.transactions for delete using (
  public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
  or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
);

create policy budgets_select on public.budgets for select using (public.is_workspace_member(workspace_id));
create policy budgets_insert on public.budgets for insert with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]) and created_by = auth.uid());
create policy budgets_update on public.budgets for update using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy budgets_delete on public.budgets for delete using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy activity_select on public.activity_logs for select using (public.is_workspace_member(workspace_id));

-- Explicit API privileges; RLS policies still decide which rows are accessible.
grant usage on schema public to authenticated;
grant select on public.profiles, public.workspaces, public.workspace_members, public.workspace_invitations, public.wallets, public.categories, public.transactions, public.budgets, public.activity_logs to authenticated;
grant insert on public.wallets, public.categories, public.transactions, public.budgets to authenticated;
grant delete on public.workspaces, public.wallets, public.categories, public.transactions, public.budgets to authenticated;

-- Protect server-maintained columns from direct client mutation.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
revoke update on public.workspaces from authenticated;
grant update (name, description, currency, settings) on public.workspaces to authenticated;
revoke update on public.wallets from authenticated;
grant update (name, type, currency, is_archived) on public.wallets to authenticated;
revoke update on public.categories from authenticated;
grant update (name, type, icon, color, is_archived) on public.categories to authenticated;
revoke update on public.transactions from authenticated;
grant update (wallet_id, type, amount, category_id, description, transaction_date, from_wallet_id, to_wallet_id, updated_by) on public.transactions to authenticated;
revoke update on public.budgets from authenticated;
grant update (category_id, month_start, limit_amount) on public.budgets to authenticated;

revoke all on function public.create_workspace(text,text,text) from public;
revoke all on function public.invite_workspace_member(uuid,text,public.workspace_role) from public;
revoke all on function public.accept_workspace_invitation(uuid) from public;
revoke all on function public.decline_workspace_invitation(uuid) from public;
revoke all on function public.cancel_workspace_invitation(uuid) from public;
revoke all on function public.change_workspace_member_role(uuid,uuid,public.workspace_role) from public;
revoke all on function public.remove_workspace_member(uuid,uuid) from public;
revoke all on function public.transfer_workspace_ownership(uuid,uuid) from public;
revoke all on function public.leave_workspace(uuid) from public;
revoke all on function public.create_transfer(uuid,uuid,uuid,numeric,text,date) from public;

grant execute on function public.create_workspace(text,text,text) to authenticated;
grant execute on function public.invite_workspace_member(uuid,text,public.workspace_role) to authenticated;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;
grant execute on function public.decline_workspace_invitation(uuid) to authenticated;
grant execute on function public.cancel_workspace_invitation(uuid) to authenticated;
grant execute on function public.change_workspace_member_role(uuid,uuid,public.workspace_role) to authenticated;
grant execute on function public.remove_workspace_member(uuid,uuid) to authenticated;
grant execute on function public.transfer_workspace_ownership(uuid,uuid) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;
grant execute on function public.create_transfer(uuid,uuid,uuid,numeric,text,date) to authenticated;

-- Add active workspace tables to Realtime. Safe for a new Supabase project.
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.budgets;
alter publication supabase_realtime add table public.workspace_members;
alter publication supabase_realtime add table public.workspace_invitations;
alter publication supabase_realtime add table public.activity_logs;

select pg_notify('pgrst', 'reload schema');

commit;
