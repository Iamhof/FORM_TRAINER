INSERT INTO public.exercises (id, name, category, muscle_group, type) VALUES
  ('barbell-bench-press', 'Barbell Bench Press', 'push', 'Chest', 'compound'),
  ('barbell-squat', 'Barbell Squat', 'legs', 'Legs', 'compound'),
  ('deadlift', 'Deadlift', 'pull', 'Back', 'compound'),
  ('overhead-press', 'Overhead Press', 'push', 'Shoulders', 'compound'),
  ('barbell-row', 'Barbell Row', 'pull', 'Back', 'compound'),
  ('pull-ups', 'Pull-ups', 'pull', 'Back', 'compound'),
  ('dips', 'Dips', 'push', 'Chest', 'compound'),
  ('incline-dumbbell-press', 'Incline Dumbbell Press', 'push', 'Chest', 'compound'),
  ('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'push', 'Shoulders', 'compound'),
  ('lat-pulldown', 'Lat Pulldown', 'pull', 'Back', 'compound'),
  ('cable-fly', 'Cable Fly', 'push', 'Chest', 'isolation'),
  ('tricep-pushdown', 'Tricep Pushdown', 'push', 'Arms', 'isolation'),
  ('romanian-deadlift', 'Romanian Deadlift', 'legs', 'Legs', 'compound'),
  ('leg-press', 'Leg Press', 'legs', 'Legs', 'compound'),
  ('leg-curl', 'Leg Curl', 'legs', 'Legs', 'isolation'),
  ('leg-extension', 'Leg Extension', 'legs', 'Legs', 'isolation'),
  ('bicep-curl', 'Bicep Curl', 'pull', 'Arms', 'isolation'),
  ('hammer-curl', 'Hammer Curl', 'pull', 'Arms', 'isolation'),
  ('lateral-raise', 'Lateral Raise', 'push', 'Shoulders', 'isolation'),
  ('face-pull', 'Face Pull', 'pull', 'Shoulders', 'isolation')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  muscle_group = EXCLUDED.muscle_group,
  type = EXCLUDED.type;

