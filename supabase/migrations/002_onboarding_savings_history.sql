-- PesoWise onboarding persistence, historical wallet snapshots, automated month-end savings,
-- and Savings borrowing/repayment support.

begin;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

update public.profiles p
set onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
where exists (
  select 1 from public.workspace_members wm where wm.user_id = p.id
);

alter table public.wallets
  add column if not exists opening_balance_effective_date date,
  add column if not exists is_savings boolean not null default false;

update public.wallets w
set opening_balance_effective_date = least(
  timezone(coalesce(ws.settings ->> 'timezone', 'Asia/Manila'), w.created_at)::date,
  coalesce((
    select min(t.transaction_date)
    from public.transactions t
    where t.workspace_id = w.workspace_id
      and (t.wallet_id = w.id or t.from_wallet_id = w.id or t.to_wallet_id = w.id)
  ), timezone(coalesce(ws.settings ->> 'timezone', 'Asia/Manila'), w.created_at)::date)
)
from public.workspaces ws
where ws.id = w.workspace_id
  and w.opening_balance_effective_date is null;

alter table public.wallets
  alter column opening_balance_effective_date drop default,
  alter column opening_balance_effective_date set not null;

-- Reuse an existing wallet named Savings when possible.
with ranked as (
  select id,
         row_number() over (partition by workspace_id order by is_archived asc, created_at asc, id) as rn
  from public.wallets
  where lower(trim(name)) = 'savings'
)
update public.wallets w
set is_savings = true,
    is_archived = false
from ranked r
where w.id = r.id and r.rn = 1;

-- Ensure every existing workspace has one separate Savings wallet.
insert into public.wallets (
  workspace_id,
  name,
  type,
  initial_balance,
  current_balance,
  currency,
  is_archived,
  created_by,
  opening_balance_effective_date,
  is_savings
)
select ws.id,
       'Savings',
       'cash'::public.wallet_type,
       0,
       0,
       ws.currency,
       false,
       ws.owner_id,
       timezone(coalesce(ws.settings ->> 'timezone', 'Asia/Manila'), ws.created_at)::date,
       true
from public.workspaces ws
where not exists (
  select 1 from public.wallets w where w.workspace_id = ws.id and w.is_savings
);

create unique index if not exists one_active_savings_wallet_per_workspace
  on public.wallets(workspace_id)
  where is_savings and not is_archived;

alter table public.workspaces
  alter column settings set default '{"member_can_manage_wallets": false, "timezone": "Asia/Manila"}'::jsonb;

update public.workspaces
set settings = coalesce(settings, '{}'::jsonb) || jsonb_build_object(
  'timezone', coalesce(settings ->> 'timezone', 'Asia/Manila')
);

alter table public.transactions
  add column if not exists transfer_kind text not null default 'standard',
  add column if not exists is_system_generated boolean not null default false,
  add column if not exists closing_month date,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.savings_loans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  savings_wallet_id uuid not null references public.wallets(id) on delete restrict,
  destination_wallet_id uuid not null references public.wallets(id) on delete restrict,
  original_amount numeric(16,2) not null check (original_amount > 0),
  outstanding_amount numeric(16,2) not null check (outstanding_amount >= 0),
  status text not null default 'open' check (status in ('open', 'repaid')),
  notes text,
  borrowed_by uuid not null references public.profiles(id) on delete restrict,
  borrowed_at timestamptz not null default now(),
  borrow_transaction_id uuid unique references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (outstanding_amount <= original_amount)
);

alter table public.transactions
  add column if not exists savings_loan_id uuid references public.savings_loans(id) on delete restrict;

create table if not exists public.wallet_month_closures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  savings_wallet_id uuid not null references public.wallets(id) on delete restrict,
  closing_month date not null check (date_trunc('month', closing_month)::date = closing_month),
  balance_before_transfer numeric(16,2) not null default 0,
  transferred_amount numeric(16,2) not null default 0 check (transferred_amount >= 0),
  balance_after_transfer numeric(16,2) not null default 0,
  status text not null check (status in ('completed', 'no_positive_balance', 'negative_balance')),
  transfer_transaction_id uuid unique references public.transactions(id) on delete set null,
  processed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, closing_month)
);

create index if not exists idx_wallets_workspace_savings on public.wallets(workspace_id, is_savings, is_archived);
create index if not exists idx_transactions_transfer_kind_month on public.transactions(workspace_id, transfer_kind, closing_month);
create unique index if not exists one_month_end_transfer_per_wallet_month
  on public.transactions(from_wallet_id, closing_month)
  where transfer_kind = 'month_end_savings';
create index if not exists idx_savings_loans_workspace_status on public.savings_loans(workspace_id, status, borrowed_at desc);
create index if not exists idx_savings_loans_destination on public.savings_loans(destination_wallet_id, status);
create index if not exists idx_month_closures_workspace_month on public.wallet_month_closures(workspace_id, closing_month desc);

drop trigger if exists savings_loans_updated_at on public.savings_loans;
create trigger savings_loans_updated_at before update on public.savings_loans
for each row execute function public.set_updated_at();
drop trigger if exists wallet_month_closures_updated_at on public.wallet_month_closures;
create trigger wallet_month_closures_updated_at before update on public.wallet_month_closures
for each row execute function public.set_updated_at();

create or replace function public.handle_workspace_membership_onboarding()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_effective_date date;
begin
  select timezone(coalesce(settings ->> 'timezone', 'Asia/Manila'), now())::date
  into v_effective_date
  from public.workspaces
  where id = new.workspace_id;

  update public.profiles
  set onboarding_completed_at = coalesce(onboarding_completed_at, now())
  where id = new.user_id;

  if new.role = 'owner' and not exists (
    select 1 from public.wallets w where w.workspace_id = new.workspace_id and w.is_savings and not w.is_archived
  ) then
    insert into public.wallets (
      workspace_id, name, type, initial_balance, current_balance, currency,
      is_archived, created_by, opening_balance_effective_date, is_savings
    )
    select ws.id, 'Savings', 'cash'::public.wallet_type, 0, 0, ws.currency,
           false, new.user_id, coalesce(v_effective_date, timezone('Asia/Manila', now())::date), true
    from public.workspaces ws
    where ws.id = new.workspace_id
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists workspace_membership_onboarding on public.workspace_members;
create trigger workspace_membership_onboarding
after insert on public.workspace_members
for each row execute function public.handle_workspace_membership_onboarding();

create or replace function public.prevent_savings_wallet_archive()
returns trigger
language plpgsql
as $$
begin
  if old.is_savings and (new.is_archived or not new.is_savings) then
    raise exception 'The workspace Savings wallet cannot be archived or converted';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_savings_wallet on public.wallets;
create trigger protect_savings_wallet
before update on public.wallets
for each row execute function public.prevent_savings_wallet_archive();

create or replace function public.validate_wallet_effective_date()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_today date;
begin
  select timezone(coalesce(settings ->> 'timezone', 'Asia/Manila'), now())::date
  into v_today
  from public.workspaces
  where id = new.workspace_id;

  if v_today is null then raise exception 'Workspace not found'; end if;
  new.opening_balance_effective_date := coalesce(new.opening_balance_effective_date, v_today);
  if new.opening_balance_effective_date > v_today then
    raise exception 'Wallet opening date cannot be in the future';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_wallet_effective_date on public.wallets;
create trigger validate_wallet_effective_date
before insert or update of opening_balance_effective_date on public.wallets
for each row execute function public.validate_wallet_effective_date();

create or replace function public.wallet_balance_as_of(p_wallet_id uuid, p_as_of date)
returns numeric
language sql
stable
security definer set search_path = public
as $$
  select case
    when p_as_of < w.opening_balance_effective_date then 0::numeric
    else w.initial_balance + coalesce(sum(
      case
        when t.type = 'income' and t.wallet_id = w.id then t.amount
        when t.type = 'expense' and t.wallet_id = w.id then -t.amount
        when t.type = 'transfer' and t.to_wallet_id = w.id then t.amount
        when t.type = 'transfer' and t.from_wallet_id = w.id then -t.amount
        else 0
      end
    ), 0)
  end
  from public.wallets w
  left join public.transactions t
    on t.workspace_id = w.workspace_id
   and t.transaction_date between w.opening_balance_effective_date and p_as_of
   and (
     t.wallet_id = w.id
     or t.from_wallet_id = w.id
     or t.to_wallet_id = w.id
   )
  where w.id = p_wallet_id
  group by w.id, w.initial_balance, w.opening_balance_effective_date;
$$;

create or replace function public.recalculate_workspace_balances(p_workspace_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_as_of date;
begin
  select timezone(coalesce(settings ->> 'timezone', 'Asia/Manila'), now())::date
  into v_as_of
  from public.workspaces
  where id = p_workspace_id;

  if v_as_of is null then raise exception 'Workspace not found'; end if;

  with calculated as (
    select w.id, public.wallet_balance_as_of(w.id, v_as_of) as balance
    from public.wallets w
    where w.workspace_id = p_workspace_id
  )
  update public.wallets w
  set current_balance = calculated.balance,
      updated_at = now()
  from calculated
  where w.id = calculated.id
    and w.current_balance is distinct from calculated.balance;
end;
$$;

create or replace function public.validate_transaction_references()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_wallet_start date;
  v_wallet_savings boolean;
  v_timezone text;
  v_today date;
  v_from_start date;
  v_to_start date;
  v_from_savings boolean;
  v_to_savings boolean;
begin
  select coalesce(settings ->> 'timezone', 'Asia/Manila')
  into v_timezone
  from public.workspaces
  where id = new.workspace_id;
  if v_timezone is null then raise exception 'Workspace not found'; end if;
  v_today := timezone(v_timezone, now())::date;
  if new.transaction_date > v_today then raise exception 'Transaction date cannot be in the future'; end if;

  if new.wallet_id is not null then
    select opening_balance_effective_date, is_savings into v_wallet_start, v_wallet_savings
    from public.wallets
    where id = new.wallet_id and workspace_id = new.workspace_id and not is_archived;
    if v_wallet_start is null then raise exception 'Wallet does not belong to workspace'; end if;
    if new.transaction_date < v_wallet_start then raise exception 'Transaction date is before the wallet start date'; end if;
  end if;

  if new.from_wallet_id is not null then
    select opening_balance_effective_date, is_savings into v_from_start, v_from_savings
    from public.wallets
    where id = new.from_wallet_id and workspace_id = new.workspace_id and not is_archived;
    if v_from_start is null then raise exception 'Source wallet does not belong to workspace'; end if;
    if new.transaction_date < v_from_start then raise exception 'Transaction date is before the source wallet start date'; end if;
  end if;

  if new.to_wallet_id is not null then
    select opening_balance_effective_date, is_savings into v_to_start, v_to_savings
    from public.wallets
    where id = new.to_wallet_id and workspace_id = new.workspace_id and not is_archived;
    if v_to_start is null then raise exception 'Destination wallet does not belong to workspace'; end if;
    if new.transaction_date < v_to_start then raise exception 'Transaction date is before the destination wallet start date'; end if;
  end if;

  if new.category_id is not null and not exists(
    select 1 from public.categories
    where id = new.category_id
      and workspace_id = new.workspace_id
      and type::text = new.type::text
      and not is_archived
  ) then
    raise exception 'Category does not belong to workspace or type does not match';
  end if;

  if new.type <> 'transfer' then
    if coalesce(v_wallet_savings, false) then
      raise exception 'Use wallet transfers, Borrow from Savings, or Repay Savings for the Savings wallet';
    end if;
    if new.transfer_kind <> 'standard' or new.is_system_generated or new.closing_month is not null or new.savings_loan_id is not null then
      raise exception 'Income and expense transactions cannot contain transfer metadata';
    end if;
  elsif new.transfer_kind = 'month_end_savings' then
    if not new.is_system_generated or new.closing_month is null or v_from_savings or not v_to_savings then
      raise exception 'Invalid month-end Savings transfer';
    end if;
  elsif new.transfer_kind = 'savings_borrow' then
    if new.is_system_generated or new.savings_loan_id is null or not v_from_savings or v_to_savings then
      raise exception 'Invalid Savings borrowing transfer';
    end if;
  elsif new.transfer_kind = 'savings_repayment' then
    if new.is_system_generated or new.savings_loan_id is null or v_from_savings or not v_to_savings then
      raise exception 'Invalid Savings repayment transfer';
    end if;
  elsif new.transfer_kind = 'standard' then
    if new.is_system_generated or new.closing_month is not null or new.savings_loan_id is not null then
      raise exception 'Invalid standard transfer metadata';
    end if;
    if v_from_savings and not v_to_savings then
      raise exception 'Use Borrow from Savings to move money out of Savings';
    end if;
  else
    raise exception 'Unsupported transfer kind';
  end if;

  new.updated_by = coalesce(auth.uid(), new.updated_by, new.created_by);
  return new;
end;
$$;

create or replace function public.reconcile_workspace_month_end(p_workspace_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_timezone text;
  v_current_month date;
  v_savings_id uuid;
  v_owner_id uuid;
  v_wallet record;
  v_month date;
  v_month_end date;
  v_opening numeric;
  v_movement numeric;
  v_before numeric;
  v_after numeric;
  v_transfer_amount numeric;
  v_transfer_id uuid;
  v_status text;
begin
  perform pg_advisory_xact_lock(hashtext(p_workspace_id::text));

  select coalesce(settings ->> 'timezone', 'Asia/Manila'), owner_id
  into v_timezone, v_owner_id
  from public.workspaces
  where id = p_workspace_id;

  if not found then raise exception 'Workspace not found'; end if;

  v_current_month := date_trunc('month', timezone(v_timezone, now()))::date;

  select id into v_savings_id
  from public.wallets
  where workspace_id = p_workspace_id and is_savings and not is_archived
  order by created_at asc
  limit 1;

  if v_savings_id is null then
    insert into public.wallets (
      workspace_id, name, type, initial_balance, current_balance, currency,
      is_archived, created_by, opening_balance_effective_date, is_savings
    )
    select id, 'Savings', 'cash'::public.wallet_type, 0, 0, currency,
           false, owner_id, timezone(v_timezone, created_at)::date, true
    from public.workspaces where id = p_workspace_id
    returning id into v_savings_id;
  end if;

  perform set_config('pesowise.reconciling', '1', true);

  for v_wallet in
    select * from public.wallets
    where workspace_id = p_workspace_id and not is_savings
    order by opening_balance_effective_date, created_at, id
  loop
    v_month := date_trunc('month', v_wallet.opening_balance_effective_date)::date;
    v_opening := v_wallet.initial_balance;

    while v_month < v_current_month loop
      v_month_end := (v_month + interval '1 month - 1 day')::date;

      select coalesce(sum(
        case
          when t.type = 'income' and t.wallet_id = v_wallet.id then t.amount
          when t.type = 'expense' and t.wallet_id = v_wallet.id then -t.amount
          when t.type = 'transfer' and t.to_wallet_id = v_wallet.id then t.amount
          when t.type = 'transfer' and t.from_wallet_id = v_wallet.id then -t.amount
          else 0
        end
      ), 0)
      into v_movement
      from public.transactions t
      where t.workspace_id = p_workspace_id
        and t.transaction_date between greatest(v_month, v_wallet.opening_balance_effective_date) and v_month_end
        and t.transfer_kind <> 'month_end_savings'
        and (
          t.wallet_id = v_wallet.id
          or t.from_wallet_id = v_wallet.id
          or t.to_wallet_id = v_wallet.id
        );

      v_before := v_opening + v_movement;
      v_transfer_amount := greatest(v_before, 0);
      v_after := case when v_before > 0 then 0 else v_before end;
      v_status := case
        when v_before > 0 then 'completed'
        when v_before < 0 then 'negative_balance'
        else 'no_positive_balance'
      end;

      select id into v_transfer_id
      from public.transactions
      where from_wallet_id = v_wallet.id
        and transfer_kind = 'month_end_savings'
        and closing_month = v_month
      limit 1;

      if v_transfer_amount > 0 then
        if v_transfer_id is null then
          insert into public.transactions (
            workspace_id, type, amount, description, transaction_date,
            from_wallet_id, to_wallet_id, created_by, updated_by,
            transfer_kind, is_system_generated, closing_month, metadata
          ) values (
            p_workspace_id, 'transfer', v_transfer_amount,
            to_char(v_month, 'FMMonth YYYY') || ' month-end Savings',
            v_month_end, v_wallet.id, v_savings_id, v_owner_id, v_owner_id,
            'month_end_savings', true, v_month,
            jsonb_build_object('source_wallet_id', v_wallet.id, 'closing_month', v_month)
          ) returning id into v_transfer_id;
        else
          update public.transactions
          set amount = v_transfer_amount,
              description = to_char(v_month, 'FMMonth YYYY') || ' month-end Savings',
              transaction_date = v_month_end,
              to_wallet_id = v_savings_id,
              updated_by = v_owner_id,
              metadata = jsonb_build_object('source_wallet_id', v_wallet.id, 'closing_month', v_month)
          where id = v_transfer_id
            and (
              amount is distinct from v_transfer_amount
              or description is distinct from to_char(v_month, 'FMMonth YYYY') || ' month-end Savings'
              or transaction_date is distinct from v_month_end
              or to_wallet_id is distinct from v_savings_id
              or metadata is distinct from jsonb_build_object('source_wallet_id', v_wallet.id, 'closing_month', v_month)
            );
        end if;
      else
        if v_transfer_id is not null then
          delete from public.transactions where id = v_transfer_id;
          v_transfer_id := null;
        end if;
      end if;

      insert into public.wallet_month_closures (
        workspace_id, wallet_id, savings_wallet_id, closing_month,
        balance_before_transfer, transferred_amount, balance_after_transfer,
        status, transfer_transaction_id, processed_at
      ) values (
        p_workspace_id, v_wallet.id, v_savings_id, v_month,
        v_before, v_transfer_amount, v_after,
        v_status, v_transfer_id, now()
      )
      on conflict (wallet_id, closing_month) do update set
        savings_wallet_id = excluded.savings_wallet_id,
        balance_before_transfer = excluded.balance_before_transfer,
        transferred_amount = excluded.transferred_amount,
        balance_after_transfer = excluded.balance_after_transfer,
        status = excluded.status,
        transfer_transaction_id = excluded.transfer_transaction_id,
        processed_at = now(),
        updated_at = now()
      where public.wallet_month_closures.savings_wallet_id is distinct from excluded.savings_wallet_id
         or public.wallet_month_closures.balance_before_transfer is distinct from excluded.balance_before_transfer
         or public.wallet_month_closures.transferred_amount is distinct from excluded.transferred_amount
         or public.wallet_month_closures.balance_after_transfer is distinct from excluded.balance_after_transfer
         or public.wallet_month_closures.status is distinct from excluded.status
         or public.wallet_month_closures.transfer_transaction_id is distinct from excluded.transfer_transaction_id;

      v_opening := v_after;
      v_month := (v_month + interval '1 month')::date;
    end loop;
  end loop;

  perform public.recalculate_workspace_balances(p_workspace_id);
  perform set_config('pesowise.reconciling', '0', true);
end;
$$;

create or replace function public.reconcile_after_wallet_history_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_timezone text;
  v_current_month date;
begin
  if new.is_savings or coalesce(current_setting('pesowise.reconciling', true), '0') = '1' then
    return new;
  end if;

  select coalesce(settings ->> 'timezone', 'Asia/Manila')
  into v_timezone
  from public.workspaces
  where id = new.workspace_id;

  v_current_month := date_trunc('month', timezone(v_timezone, now()))::date;
  if date_trunc('month', new.opening_balance_effective_date)::date < v_current_month then
    perform public.reconcile_workspace_month_end(new.workspace_id);
  end if;
  return new;
end;
$$;

drop trigger if exists reconcile_after_wallet_insert on public.wallets;
create trigger reconcile_after_wallet_insert
after insert on public.wallets
for each row execute function public.reconcile_after_wallet_history_change();

drop trigger if exists reconcile_after_wallet_history_update on public.wallets;
create trigger reconcile_after_wallet_history_update
after update of opening_balance_effective_date, initial_balance on public.wallets
for each row execute function public.reconcile_after_wallet_history_change();

create or replace function public.reconcile_after_historical_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_transaction_date date;
  v_is_system_generated boolean;
  v_timezone text;
  v_current_month date;
begin
  if tg_op = 'DELETE' then
    v_workspace_id := old.workspace_id;
    v_transaction_date := old.transaction_date;
    v_is_system_generated := old.is_system_generated;
  elsif tg_op = 'INSERT' then
    v_workspace_id := new.workspace_id;
    v_transaction_date := new.transaction_date;
    v_is_system_generated := new.is_system_generated;
  else
    v_workspace_id := new.workspace_id;
    v_transaction_date := least(new.transaction_date, old.transaction_date);
    v_is_system_generated := new.is_system_generated or old.is_system_generated;
  end if;

  if coalesce(current_setting('pesowise.reconciling', true), '0') = '1' or coalesce(v_is_system_generated, false) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select coalesce(settings ->> 'timezone', 'Asia/Manila') into v_timezone
  from public.workspaces where id = v_workspace_id;
  v_current_month := date_trunc('month', timezone(v_timezone, now()))::date;

  if v_transaction_date < v_current_month then
    perform public.reconcile_workspace_month_end(v_workspace_id);
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists zz_reconcile_historical_transaction on public.transactions;
create trigger zz_reconcile_historical_transaction
after insert or update or delete on public.transactions
for each row execute function public.reconcile_after_historical_transaction();

create or replace function public.request_month_end_reconciliation(p_workspace_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin','member']::public.workspace_role[]) then
    raise exception 'Permission denied';
  end if;
  perform public.reconcile_workspace_month_end(p_workspace_id);
end;
$$;

create or replace function public.process_due_month_end_savings()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_workspace record;
begin
  for v_workspace in select id from public.workspaces loop
    begin
      perform public.reconcile_workspace_month_end(v_workspace.id);
    exception when others then
      raise warning 'PesoWise month-end processing failed for workspace %: %', v_workspace.id, sqlerrm;
    end;
  end loop;
end;
$$;

create or replace function public.borrow_from_savings(
  p_workspace_id uuid,
  p_destination_wallet_id uuid,
  p_amount numeric,
  p_notes text default null,
  p_transaction_date date default current_date
)
returns public.savings_loans
language plpgsql
security definer set search_path = public
as $$
declare
  v_savings public.wallets;
  v_destination public.wallets;
  v_loan public.savings_loans;
  v_transaction_id uuid;
  v_available_savings numeric;
  v_timezone text;
  v_today date;
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin','member']::public.workspace_role[]) then
    raise exception 'Permission denied';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  select coalesce(settings ->> 'timezone', 'Asia/Manila') into v_timezone
  from public.workspaces where id = p_workspace_id;
  v_today := timezone(v_timezone, now())::date;
  if p_transaction_date > v_today then raise exception 'Borrowing date cannot be in the future'; end if;

  select * into v_savings from public.wallets
  where workspace_id = p_workspace_id and is_savings and not is_archived
  for update;
  if not found then raise exception 'Savings wallet not found'; end if;

  select * into v_destination from public.wallets
  where id = p_destination_wallet_id and workspace_id = p_workspace_id and not is_archived and not is_savings
  for update;
  if not found then raise exception 'Destination wallet not found'; end if;

  if p_transaction_date < greatest(v_savings.opening_balance_effective_date, v_destination.opening_balance_effective_date) then
    raise exception 'Borrowing date is before a wallet start date';
  end if;
  v_available_savings := public.wallet_balance_as_of(v_savings.id, p_transaction_date);
  if v_available_savings < p_amount then raise exception 'Cannot borrow more than the available Savings balance on that date'; end if;

  insert into public.savings_loans (
    workspace_id, savings_wallet_id, destination_wallet_id,
    original_amount, outstanding_amount, notes, borrowed_by, borrowed_at
  ) values (
    p_workspace_id, v_savings.id, v_destination.id,
    p_amount, p_amount, nullif(trim(p_notes), ''), auth.uid(), p_transaction_date::timestamptz
  ) returning * into v_loan;

  insert into public.transactions (
    workspace_id, type, amount, description, transaction_date,
    from_wallet_id, to_wallet_id, created_by, updated_by,
    transfer_kind, savings_loan_id, metadata
  ) values (
    p_workspace_id, 'transfer', p_amount, 'Borrowed from Savings', p_transaction_date,
    v_savings.id, v_destination.id, auth.uid(), auth.uid(),
    'savings_borrow', v_loan.id,
    jsonb_build_object('notes', coalesce(p_notes, ''), 'destination_wallet_id', v_destination.id)
  ) returning id into v_transaction_id;

  update public.savings_loans set borrow_transaction_id = v_transaction_id where id = v_loan.id
  returning * into v_loan;

  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (p_workspace_id, auth.uid(), 'borrowed from Savings', 'savings_loan', v_loan.id,
          jsonb_build_object('destination_wallet_id', v_destination.id, 'amount', p_amount));

  return v_loan;
end;
$$;

create or replace function public.repay_savings_loan(
  p_loan_id uuid,
  p_source_wallet_id uuid,
  p_amount numeric,
  p_notes text default null,
  p_transaction_date date default current_date
)
returns public.savings_loans
language plpgsql
security definer set search_path = public
as $$
declare
  v_loan public.savings_loans;
  v_source public.wallets;
  v_savings public.wallets;
  v_available_source numeric;
  v_timezone text;
  v_today date;
begin
  select * into v_loan from public.savings_loans where id = p_loan_id for update;
  if not found then raise exception 'Savings loan not found'; end if;
  if not public.has_workspace_role(v_loan.workspace_id, array['owner','admin','member']::public.workspace_role[]) then
    raise exception 'Permission denied';
  end if;
  if v_loan.status <> 'open' or v_loan.outstanding_amount <= 0 then raise exception 'This Savings loan is already repaid'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_amount > v_loan.outstanding_amount then raise exception 'Repayment exceeds the outstanding borrowed amount'; end if;
  if p_transaction_date < v_loan.borrowed_at::date then raise exception 'Repayment date cannot be before the borrowing date'; end if;

  select coalesce(settings ->> 'timezone', 'Asia/Manila') into v_timezone
  from public.workspaces where id = v_loan.workspace_id;
  v_today := timezone(v_timezone, now())::date;
  if p_transaction_date > v_today then raise exception 'Repayment date cannot be in the future'; end if;

  select * into v_source from public.wallets
  where id = p_source_wallet_id and workspace_id = v_loan.workspace_id and not is_archived and not is_savings
  for update;
  if not found then raise exception 'Source wallet not found'; end if;

  select * into v_savings from public.wallets where id = v_loan.savings_wallet_id for update;
  if not found then raise exception 'Savings wallet not found'; end if;
  v_available_source := public.wallet_balance_as_of(v_source.id, p_transaction_date);
  if v_available_source < p_amount then raise exception 'Source wallet does not have enough available balance on that date'; end if;

  insert into public.transactions (
    workspace_id, type, amount, description, transaction_date,
    from_wallet_id, to_wallet_id, created_by, updated_by,
    transfer_kind, savings_loan_id, metadata
  ) values (
    v_loan.workspace_id, 'transfer', p_amount, 'Repay Savings', p_transaction_date,
    v_source.id, v_savings.id, auth.uid(), auth.uid(),
    'savings_repayment', v_loan.id,
    jsonb_build_object('notes', coalesce(p_notes, ''), 'source_wallet_id', v_source.id)
  );

  update public.savings_loans
  set outstanding_amount = outstanding_amount - p_amount,
      status = case when outstanding_amount - p_amount = 0 then 'repaid' else 'open' end,
      updated_at = now()
  where id = v_loan.id
  returning * into v_loan;

  insert into public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  values (v_loan.workspace_id, auth.uid(), 'repaid Savings', 'savings_loan', v_loan.id,
          jsonb_build_object('source_wallet_id', v_source.id, 'amount', p_amount));

  return v_loan;
end;
$$;

create or replace function public.get_wallet_month_snapshot(
  p_workspace_id uuid,
  p_month_start date,
  p_include_archived boolean default false
)
returns table (
  id uuid,
  workspace_id uuid,
  name text,
  type public.wallet_type,
  initial_balance numeric,
  current_balance numeric,
  currency text,
  is_archived boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  opening_balance_effective_date date,
  is_savings boolean,
  creator jsonb,
  opening_balance numeric,
  month_income numeric,
  month_expenses numeric,
  transfers_in numeric,
  transfers_out numeric,
  month_end_savings numeric,
  balance_before_savings numeric,
  closing_balance numeric
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_month_end date;
begin
  if not public.is_workspace_member(p_workspace_id) then raise exception 'Permission denied'; end if;
  if date_trunc('month', p_month_start)::date <> p_month_start then raise exception 'Month start must be the first day of a month'; end if;
  v_month_end := (p_month_start + interval '1 month - 1 day')::date;

  return query
  select
    w.id,
    w.workspace_id,
    w.name,
    w.type,
    w.initial_balance,
    public.wallet_balance_as_of(w.id, v_month_end) as current_balance,
    w.currency,
    w.is_archived,
    w.created_by,
    w.created_at,
    w.updated_at,
    w.opening_balance_effective_date,
    w.is_savings,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'avatar_url', p.avatar_url
    ) as creator,
    public.wallet_balance_as_of(w.id, p_month_start - 1) as opening_balance,
    coalesce(sum(t.amount) filter (
      where t.type = 'income' and t.wallet_id = w.id and t.transaction_date between p_month_start and v_month_end
    ), 0) as month_income,
    coalesce(sum(t.amount) filter (
      where t.type = 'expense' and t.wallet_id = w.id and t.transaction_date between p_month_start and v_month_end
    ), 0) as month_expenses,
    coalesce(sum(t.amount) filter (
      where t.type = 'transfer' and t.to_wallet_id = w.id and t.transaction_date between p_month_start and v_month_end
    ), 0) as transfers_in,
    coalesce(sum(t.amount) filter (
      where t.type = 'transfer' and t.from_wallet_id = w.id and t.transaction_date between p_month_start and v_month_end
    ), 0) as transfers_out,
    coalesce(sum(t.amount) filter (
      where t.type = 'transfer' and t.transfer_kind = 'month_end_savings' and t.from_wallet_id = w.id and t.closing_month = p_month_start
    ), 0) as month_end_savings,
    public.wallet_balance_as_of(w.id, v_month_end) + coalesce(sum(t.amount) filter (
      where t.type = 'transfer' and t.transfer_kind = 'month_end_savings' and t.from_wallet_id = w.id and t.closing_month = p_month_start
    ), 0) as balance_before_savings,
    public.wallet_balance_as_of(w.id, v_month_end) as closing_balance
  from public.wallets w
  join public.profiles p on p.id = w.created_by
  left join public.transactions t on t.workspace_id = w.workspace_id and (
    t.wallet_id = w.id or t.from_wallet_id = w.id or t.to_wallet_id = w.id
  )
  where w.workspace_id = p_workspace_id
    and (p_include_archived or not w.is_archived)
  group by w.id, p.id, p.full_name, p.email, p.avatar_url
  order by w.is_savings asc, w.created_at asc;
end;
$$;

alter table public.savings_loans enable row level security;
alter table public.wallet_month_closures enable row level security;

create policy savings_loans_select on public.savings_loans
for select using (public.is_workspace_member(workspace_id));

create policy month_closures_select on public.wallet_month_closures
for select using (public.is_workspace_member(workspace_id));

drop policy if exists wallets_insert on public.wallets;
create policy wallets_insert on public.wallets for insert with check (
  public.member_can_manage_wallets(workspace_id)
  and created_by = auth.uid()
  and not is_savings
);

drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions for insert with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member']::public.workspace_role[])
  and created_by = auth.uid()
  and transfer_kind = 'standard'
  and not is_system_generated
  and closing_month is null
  and savings_loan_id is null
);

drop policy if exists transactions_delete on public.transactions;
create policy transactions_delete on public.transactions for delete using (
  (
    public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
    or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
  )
  and transfer_kind = 'standard'
  and not is_system_generated
);

drop policy if exists transactions_update on public.transactions;
create policy transactions_update on public.transactions for update using (
  public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
  or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
) with check (
  (
    public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])
    or (public.workspace_role_for(workspace_id) = 'member' and created_by = auth.uid())
  )
  and transfer_kind = 'standard'
  and not is_system_generated
  and closing_month is null
  and savings_loan_id is null
);

grant select on public.savings_loans, public.wallet_month_closures to authenticated;
grant execute on function public.get_wallet_month_snapshot(uuid,date,boolean) to authenticated;
grant execute on function public.request_month_end_reconciliation(uuid) to authenticated;
grant execute on function public.borrow_from_savings(uuid,uuid,numeric,text,date) to authenticated;
grant execute on function public.repay_savings_loan(uuid,uuid,numeric,text,date) to authenticated;
grant execute on function public.process_due_month_end_savings() to service_role;

revoke all on function public.reconcile_workspace_month_end(uuid) from public, anon, authenticated;
revoke all on function public.process_due_month_end_savings() from public, anon, authenticated;
revoke all on function public.recalculate_workspace_balances(uuid) from public, anon, authenticated;
revoke all on function public.wallet_balance_as_of(uuid,date) from public, anon, authenticated;

alter publication supabase_realtime add table public.savings_loans;
alter publication supabase_realtime add table public.wallet_month_closures;

select pg_notify('pgrst', 'reload schema');

commit;

-- Supabase-hosted projects support pg_cron. The block is intentionally non-fatal so
-- local PostgreSQL instances without pg_cron can still apply the rest of the migration.
do $$
begin
  begin
    execute 'create extension if not exists pg_cron';
  exception when others then
    raise notice 'pg_cron is not available; use the included Edge Function or schedule public.process_due_month_end_savings() manually.';
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'pesowise-month-end-savings';

    perform cron.schedule(
      'pesowise-month-end-savings',
      '20 16 * * *',
      'select public.process_due_month_end_savings();'
    );
  end if;
exception when others then
  raise notice 'Could not create the automatic month-end cron job: %', sqlerrm;
end;
$$;
