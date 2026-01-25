begin;

create or replace view public.pt_profile_view as
select
  u.id,
  u.email,
  coalesce(p.name, split_part(u.email, '@', 1)) as name,
  coalesce(p.is_pt, false) as is_pt
from auth.users u
left join public.profiles p on p.user_id = u.id;

comment on view public.pt_profile_view is
  'Aggregated PT profile data combining auth.users and public.profiles';

commit;

