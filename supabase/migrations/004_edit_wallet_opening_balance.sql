-- Editable wallet opening balance for regular wallets.
-- Apply after 003_wallet_date_and_removal.sql.

-- Keep wallet updates column-scoped. The current balance remains protected and
-- is recalculated by database functions rather than edited directly.
revoke update on public.wallets from authenticated;
grant update (
  name,
  type,
  currency,
  is_archived,
  opening_balance_effective_date,
  initial_balance
) on public.wallets to authenticated;

-- Recalculate current balances immediately when a wallet opening value or date
-- changes. Historical wallets also rebuild their month-end Savings records.
create or replace function public.reconcile_after_wallet_history_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_timezone text;
  v_current_month date;
begin
  if coalesce(current_setting('pesowise.reconciling', true), '0') = '1' then
    return new;
  end if;

  -- The Savings opening value is managed by the system and is not exposed for
  -- editing in the application. Recalculate defensively if it changes through
  -- an authorized server-side operation.
  if new.is_savings then
    perform public.recalculate_workspace_balances(new.workspace_id);
    return new;
  end if;

  select coalesce(settings ->> 'timezone', 'Asia/Manila')
  into v_timezone
  from public.workspaces
  where id = new.workspace_id;

  if v_timezone is null then
    raise exception 'Workspace not found';
  end if;

  v_current_month := date_trunc('month', timezone(v_timezone, now()))::date;

  if date_trunc('month', new.opening_balance_effective_date)::date < v_current_month then
    perform public.reconcile_workspace_month_end(new.workspace_id);
  else
    perform public.recalculate_workspace_balances(new.workspace_id);
  end if;

  return new;
end;
$$;

-- The trigger already exists from migration 002 and includes initial_balance.
-- Recreate it to keep this migration safe for installations with partial setup.
drop trigger if exists reconcile_after_wallet_history_update on public.wallets;
create trigger reconcile_after_wallet_history_update
after update of opening_balance_effective_date, initial_balance on public.wallets
for each row execute function public.reconcile_after_wallet_history_change();
