begin;
-- Keep sending limits independently of deletable messages.
create table if not exists public.comment_send_limits (
 author_id uuid primary key references auth.users(id) on delete cascade,
 last_sent_at timestamptz not null
);
alter table public.comment_send_limits enable row level security;
revoke all on public.comment_send_limits from anon,authenticated;
insert into public.comment_send_limits(author_id,last_sent_at)
 select author_id,max(created_at) from public.visit_comments group by author_id
 on conflict(author_id) do update set last_sent_at=greatest(public.comment_send_limits.last_sent_at,excluded.last_sent_at);
create or replace function public.add_visit_comment(p_token uuid,p_story text,p_nickname text,p_body text) returns void
language plpgsql security definer set search_path='' as $$
declare player uuid:=auth.uid(); owner uuid;
begin
 if player is null then raise exception 'Sign in to comment' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(player::text,0));
 select owner_id into owner from public.world_visits where active and token=p_token for key share;
 if owner is null then raise exception 'Visit unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended('visit:'||owner::text,0));
 if exists(select 1 from public.comment_send_limits where author_id=player and last_sent_at>now()-interval '15 seconds') then raise exception 'Espera 15 segundos antes de enviar otro mensaje.'; end if;
 if (select count(*) from public.visit_comments where owner_id=owner)>=500 then raise exception 'Este jardín alcanzó su límite de mensajes.'; end if;
 insert into public.visit_comments(owner_id,author_id,story_id,nickname,body) values(owner,player,p_story,trim(p_nickname),trim(p_body));
 insert into public.comment_send_limits(author_id,last_sent_at) values(player,now()) on conflict(author_id) do update set last_sent_at=excluded.last_sent_at;
end $$;

revoke all on function public.add_visit_comment(uuid,text,text,text) from public,anon;
grant execute on function public.add_visit_comment(uuid,text,text,text) to authenticated;
commit;
