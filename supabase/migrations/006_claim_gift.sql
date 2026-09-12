begin;
create table if not exists public.gift_invitations (
 email text primary key check(email=lower(btrim(email))),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768),
 claimed_owner uuid references auth.users(id) on delete set null
);
alter table public.gift_invitations enable row level security;
revoke all on public.gift_invitations from anon,authenticated;
create or replace function public.claim_my_gift() returns boolean
language plpgsql security definer set search_path='' as $$
declare player uuid:=auth.uid(); verified_email text; invitation public.gift_invitations%rowtype;
begin
 if player is null then raise exception 'Authentication required' using errcode='42501';end if;
 select lower(btrim(email)) into verified_email from auth.users where id=player and email_confirmed_at is not null;
 if verified_email is null then return false;end if;
 select * into invitation from public.gift_invitations where email=verified_email for update;
 if not found or (invitation.claimed_owner is not null and invitation.claimed_owner<>player) then return false;end if;
 if exists(select 1 from public.world_gifts where owner_id=player) then return false;end if;
 insert into public.world_gifts(owner_id,payload) values(player,invitation.payload);
 update public.gift_invitations set claimed_owner=player where email=verified_email;
 return true;
end $$;
revoke all on function public.claim_my_gift() from public;
grant execute on function public.claim_my_gift() to authenticated;
commit;
