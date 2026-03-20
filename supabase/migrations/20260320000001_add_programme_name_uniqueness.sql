-- Enforce unique programme names per user at the database level.
-- The app already checks for duplicates in the tRPC route, but this
-- provides a safety net against race conditions.
ALTER TABLE public.programmes
  ADD CONSTRAINT programmes_user_id_name_unique UNIQUE (user_id, name);
