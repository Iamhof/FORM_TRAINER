create table if not exists public.exercises (
  id text primary key,
  name text not null,
  category text not null,
  muscle_group text not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exercises enable row level security;

create policy "Public read access"
  on public.exercises for select
  using ( true );

create policy "Admin write access"
  on public.exercises for insert
  with check ( auth.role() = 'service_role' );

create policy "Admin update access"
  on public.exercises for update
  using ( auth.role() = 'service_role' );

create policy "Admin delete access"
  on public.exercises for delete
  using ( auth.role() = 'service_role' );

