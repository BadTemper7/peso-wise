-- Editable wallet opening dates and workspace-owner-only wallet removal.
-- Apply after 001_initial_schema.sql and 002_onboarding_savings_history.sql.

-- Allow the frontend to update the historical effective date. RLS still limits
-- wallet updates to users who can manage wallets in the workspace.
revoke update on public.wallets from authenticated;
grant update (name, type, currency, is_archived, opening_balance_effective_date) on public.wallets to authenticated;

-- A wallet date may be corrected, but it cannot be moved past activity that
-- already belongs to the wallet. This keeps transactions and month-end records
-- consistent while still allowing typo corrections and earlier start dates.
create or replace function public.validate_wallet_effective_date()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_today date;
  v_earliest_activity date;
begin
  select timezone(coalesce(settings ->> 'timezone', 'Asia/Manila'), now())::date
  into v_today
  from public.workspaces
  where id = new.workspace_id;

  if v_today is null then
    raise exception 'Workspace not found';
  end if;

  new.opening_balance_effective_date := coalesce(new.opening_balance_effective_date, v_today);

  if new.opening_balance_effective_date > v_today then
    raise exception 'Wallet opening date cannot be in the future';
  end if;

  if tg_op = 'UPDATE' and new.opening_balance_effective_date is distinct from old.opening_balance_effective_date then
    select min(activity_date)
    into v_earliest_activity
    from (
      select t.transaction_date as activity_date
      from public.transactions t
      where t.wallet_id = old.id
         or t.from_wallet_id = old.id
         or t.to_wallet_id = old.id

      union all

      select c.closing_month as activity_date
      from public.wallet_month_closures c
      where c.wallet_id = old.id
    ) activity;

    if v_earliest_activity is not null and new.opening_balance_effective_date > v_earliest_activity then
      raise exception 'Wallet start date cannot be after existing wallet activity';
    end if;
  end if;

  return new;
end;
$$;

-- Keep permanent removal safe. Savings can never be removed. Regular wallets
-- can only be permanently removed when they have no financial activity.

-- Only the primary workspace Owner may permanently remove a wallet. Admin,
-- Member, and Viewer roles may not delete wallets. Members with the optional
-- wallet-management setting can still create/edit wallets, but not remove them.
drop policy if exists wallets_delete on public.wallets;
create policy wallets_delete on public.wallets
for delete using (public.workspace_role_for(workspace_id) = 'owner');

create or replace function public.prevent_wallet_delete_with_transactions()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.is_savings then
    raise exception 'The workspace Savings wallet cannot be removed';
  end if;

  if exists (
    select 1
    from public.transactions
    where wallet_id = old.id
       or from_wallet_id = old.id
       or to_wallet_id = old.id
  ) then
    raise exception 'Wallet has transactions. Archive it instead.';
  end if;

  if exists (
    select 1
    from public.wallet_month_closures
    where wallet_id = old.id or savings_wallet_id = old.id
  ) then
    raise exception 'Wallet has monthly records. Archive it instead.';
  end if;

  if exists (
    select 1
    from public.savings_loans
    where destination_wallet_id = old.id or savings_wallet_id = old.id
  ) then
    raise exception 'Wallet has Savings borrowing history. Archive it instead.';
  end if;

  return old;
end;
$$;

-- The original trigger name is retained, so replacing the function updates the
-- behavior for existing installations without creating duplicate triggers.
