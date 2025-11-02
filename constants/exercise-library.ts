import { Exercise, ExerciseCategory } from '@/types/exercises';

export const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    categories: ['Push', 'Chest'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    description: 'The barbell bench press is a compound pushing movement that primarily targets the pectoral muscles, anterior deltoids, and triceps.',
    instructions: [
      'Lie flat on the bench with your feet planted firmly on the ground',
      'Grip the barbell slightly wider than shoulder-width apart',
      'Unrack the bar and position it directly above your chest',
      'Lower the bar in a controlled manner to your mid-chest',
      'Press the bar back up explosively to the starting position',
      'Keep your shoulder blades retracted throughout the movement'
    ],
    tips: [
      'Keep your wrists straight and elbows at a 45-degree angle',
      'Maintain tension in your upper back throughout',
      'Drive through your legs for additional power',
      'Breathe in on the descent, out on the ascent'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Bench']
  },
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    description: 'The king of leg exercises. A compound movement that builds overall lower body strength and mass.',
    instructions: [
      'Position the bar on your upper traps (high bar) or rear delts (low bar)',
      'Stand with feet shoulder-width apart, toes slightly out',
      'Brace your core and maintain a neutral spine',
      'Break at the hips and knees simultaneously',
      'Descend until thighs are parallel or below',
      'Drive through your heels to return to standing'
    ],
    tips: [
      'Keep your chest up and eyes forward',
      'Track your knees over your toes',
      'Maintain three points of contact with your feet',
      'Take a deep breath and brace before each rep'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Squat Rack']
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    categories: ['Pull', 'Back', 'Legs', 'Hamstrings', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    description: 'A fundamental compound pulling exercise that develops total body strength, particularly the posterior chain.',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend down and grip the bar just outside your legs',
      'Drop your hips, chest up, shoulders over the bar',
      'Take a deep breath and brace your core',
      'Drive through the floor, extending hips and knees',
      'Stand tall, then lower the bar with control'
    ],
    tips: [
      'Keep the bar close to your body throughout',
      'Maintain a neutral spine - avoid rounding',
      'Engage your lats by "bending the bar"',
      'Use mixed grip or straps for heavier weights'
    ],
    difficulty: 'Advanced',
    equipment: ['Barbell']
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    categories: ['Pull', 'Back', 'Arms'],
    thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    description: 'A bodyweight pulling exercise that builds back width and arm strength.',
    instructions: [
      'Hang from the bar with palms facing away, hands shoulder-width apart',
      'Engage your core and squeeze your glutes',
      'Pull your elbows down and back',
      'Lift your body until your chin clears the bar',
      'Lower yourself with control to full extension',
      'Repeat for desired reps'
    ],
    tips: [
      'Avoid swinging or using momentum',
      'Focus on pulling with your back, not just arms',
      'Start with assisted variations if needed',
      'Full range of motion is key for development'
    ],
    difficulty: 'Intermediate',
    equipment: ['Pull-up Bar']
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    categories: ['Push', 'Shoulders'],
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    description: 'A compound pressing movement that primarily targets the shoulders while engaging the core.',
    instructions: [
      'Stand with feet shoulder-width apart, bar at shoulder height',
      'Grip the bar just outside shoulder-width',
      'Brace your core and squeeze your glutes',
      'Press the bar straight overhead',
      'Move your head back slightly to let the bar pass',
      'Lock out at the top, then lower with control'
    ],
    tips: [
      'Keep your forearms vertical throughout',
      'Avoid leaning back excessively',
      'Squeeze your glutes to protect your lower back',
      'Breathe out as you press up'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell']
  },
  {
    id: 'dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    categories: ['Pull', 'Back'],
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
    description: 'An effective unilateral back exercise that builds thickness and allows for a great stretch.',
    instructions: [
      'Place one knee and hand on a bench',
      'Hold a dumbbell in your free hand',
      'Let your arm hang straight down',
      'Pull the dumbbell up towards your hip',
      'Lead with your elbow, keep it close to your body',
      'Lower with control and repeat'
    ],
    tips: [
      'Keep your back flat and core engaged',
      'Focus on the mind-muscle connection',
      'Avoid rotating your torso excessively',
      'Pull with your back, not your arm'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbell', 'Bench']
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    categories: ['Pull', 'Hamstrings', 'Glutes', 'Back'],
    thumbnail: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=2SHsk9AzdjA',
    description: 'A hip-hinge movement that emphasizes the hamstrings and glutes.',
    instructions: [
      'Stand holding a barbell at hip height',
      'Keep a slight bend in your knees',
      'Hinge at the hips, pushing them back',
      'Lower the bar down your legs, maintaining contact',
      'Feel the stretch in your hamstrings',
      'Drive your hips forward to return to standing'
    ],
    tips: [
      'Keep the bar close to your body',
      'Maintain a neutral spine throughout',
      'Focus on the stretch in your hamstrings',
      'Your knees should barely move'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell']
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    description: 'A machine-based leg exercise that allows for heavy loading with reduced spinal stress.',
    instructions: [
      'Sit in the leg press machine with your back flat',
      'Place feet shoulder-width apart on the platform',
      'Release the safety locks',
      'Lower the platform until your knees reach 90 degrees',
      'Push through your heels to extend your legs',
      'Stop just short of locking out your knees'
    ],
    tips: [
      'Keep your lower back pressed against the pad',
      'Avoid locking out completely at the top',
      'Control the descent - don\'t let it crash down',
      'Adjust foot position to target different muscles'
    ],
    difficulty: 'Beginner',
    equipment: ['Leg Press Machine']
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    categories: ['Pull', 'Back'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    description: 'A vertical pulling exercise that builds back width and prepares you for pull-ups.',
    instructions: [
      'Sit at the lat pulldown machine, knees secured',
      'Grip the bar wider than shoulder-width',
      'Lean back slightly with chest up',
      'Pull the bar down to your upper chest',
      'Squeeze your shoulder blades together',
      'Return with control to the starting position'
    ],
    tips: [
      'Pull with your elbows, not your hands',
      'Keep your chest high throughout',
      'Avoid using momentum or swinging',
      'Focus on the mind-muscle connection'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine', 'Lat Bar']
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    categories: ['Push', 'Shoulders'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    description: 'An excellent shoulder building exercise that allows for a natural pressing path.',
    instructions: [
      'Sit on a bench with back support',
      'Hold dumbbells at shoulder height',
      'Press the weights straight overhead',
      'Bring them together at the top',
      'Lower with control back to shoulder height',
      'Repeat for desired reps'
    ],
    tips: [
      'Keep your core braced throughout',
      'Avoid arching your lower back',
      'Control the descent for better gains',
      'Breathe out as you press up'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbells', 'Bench']
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
    description: 'A unilateral leg exercise that improves balance, coordination, and leg strength.',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg',
      'Lower your back knee towards the ground',
      'Keep your front knee aligned over your ankle',
      'Push through your front heel to step forward',
      'Alternate legs with each step'
    ],
    tips: [
      'Maintain an upright torso throughout',
      'Avoid letting your front knee cave inward',
      'Take a long enough step to protect your knees',
      'Start with bodyweight before adding load'
    ],
    difficulty: 'Beginner',
    equipment: ['Bodyweight', 'Dumbbells (Optional)']
  },
  {
    id: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    categories: ['Push', 'Chest'],
    thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
    description: 'An isolation exercise for the chest that maintains constant tension throughout the movement.',
    instructions: [
      'Set cable handles at chest height',
      'Stand in the center, holding both handles',
      'Take a step forward, arms extended to sides',
      'Slight bend in elbows, chest up',
      'Bring your hands together in front of your chest',
      'Return with control, feeling the stretch'
    ],
    tips: [
      'Maintain a slight bend in your elbows',
      'Focus on squeezing your chest at the peak',
      'Control the eccentric (stretching) phase',
      'Keep your torso stable - avoid swinging'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine']
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    categories: ['Arms', 'Pull'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=LY1V6UbRHFM',
    description: 'The classic bicep builder that allows for progressive overload.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hold a barbell with an underhand grip',
      'Keep your elbows close to your sides',
      'Curl the bar up towards your shoulders',
      'Squeeze your biceps at the top',
      'Lower with control to full extension'
    ],
    tips: [
      'Avoid swinging or using momentum',
      'Keep your upper arms stationary',
      'Control the descent for maximum gains',
      'Full range of motion is crucial'
    ],
    difficulty: 'Beginner',
    equipment: ['Barbell']
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    categories: ['Push', 'Arms'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    description: 'A bodyweight exercise that builds tricep strength and size.',
    instructions: [
      'Position yourself between parallel bars',
      'Start with arms fully extended',
      'Lower your body by bending your elbows',
      'Descend until upper arms are parallel to ground',
      'Press through your palms to return to start',
      'Keep your core engaged throughout'
    ],
    tips: [
      'Lean forward slightly to engage chest',
      'Stay more upright for tricep emphasis',
      'Avoid flaring your elbows out excessively',
      'Use assistance or weight as needed'
    ],
    difficulty: 'Intermediate',
    equipment: ['Parallel Bars', 'Dip Station']
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    categories: ['Legs', 'Hamstrings'],
    thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    description: 'An isolation exercise that directly targets the hamstring muscles.',
    instructions: [
      'Lie face down on the leg curl machine',
      'Position the pad on the back of your lower legs',
      'Grip the handles for stability',
      'Curl your heels towards your glutes',
      'Squeeze your hamstrings at the top',
      'Lower with control to the starting position'
    ],
    tips: [
      'Keep your hips pressed into the bench',
      'Avoid lifting your hips during the movement',
      'Control the descent - don\'t let it drop',
      'Point your toes for maximum hamstring engagement'
    ],
    difficulty: 'Beginner',
    equipment: ['Leg Curl Machine']
  },
  {
    id: 'face-pulls',
    name: 'Cable Face Pulls',
    categories: ['Pull', 'Shoulders', 'Back'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    description: 'An excellent exercise for rear deltoids and upper back health.',
    instructions: [
      'Set a cable at upper chest height with a rope attachment',
      'Grab the rope with both hands',
      'Step back to create tension',
      'Pull the rope towards your face',
      'Split the rope as it reaches your face',
      'Squeeze your shoulder blades together'
    ],
    tips: [
      'Keep your elbows high throughout',
      'Focus on pulling with your rear delts',
      'This is a high-rep, low-ego exercise',
      'Great for shoulder health and posture'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine', 'Rope Attachment']
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    categories: ['Push', 'Chest', 'Shoulders'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
    description: 'An upper chest focused pressing movement that also engages the shoulders.',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Sit with dumbbells resting on your thighs',
      'Kick the weights up to shoulder level',
      'Press the dumbbells up and slightly together',
      'Lower with control to chest level',
      'Repeat for desired reps'
    ],
    tips: [
      'Don\'t set the incline too steep (max 45 degrees)',
      'Keep your shoulder blades retracted',
      'Press in a slight arc, not straight up',
      'Control the descent for better muscle activation'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbells', 'Incline Bench']
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    description: 'A unilateral leg exercise that builds strength and improves balance.',
    instructions: [
      'Stand facing away from a bench',
      'Place one foot on the bench behind you',
      'Keep your front foot far enough forward',
      'Lower your back knee towards the ground',
      'Keep your torso upright',
      'Push through your front heel to stand'
    ],
    tips: [
      'Find the right distance from the bench first',
      'Your front shin should stay mostly vertical',
      'This is a quad-dominant movement',
      'Start with bodyweight before adding load'
    ],
    difficulty: 'Intermediate',
    equipment: ['Bench', 'Dumbbells (Optional)']
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    categories: ['Shoulders', 'Push'],
    thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    description: 'An isolation exercise for the side deltoids with constant tension.',
    instructions: [
      'Stand beside a cable machine',
      'Hold the cable handle in your far hand',
      'Start with your arm across your body',
      'Raise your arm out to the side',
      'Lift until your arm is parallel to the floor',
      'Lower with control and repeat'
    ],
    tips: [
      'Lead with your elbow, not your hand',
      'Keep a slight bend in your elbow',
      'Avoid swinging or using momentum',
      'Focus on feeling your side delt working'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine']
  },
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    categories: ['Glutes', 'Legs'],
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
    description: 'The best exercise for building powerful glutes.',
    instructions: [
      'Sit on the ground with your upper back against a bench',
      'Roll a barbell over your hips (use a pad)',
      'Plant your feet flat, knees bent',
      'Drive through your heels to lift your hips',
      'Lift until your body forms a straight line',
      'Squeeze your glutes hard at the top'
    ],
    tips: [
      'Keep your chin tucked throughout',
      'Push through your heels, not your toes',
      'Focus on squeezing your glutes, not arching your back',
      'This exercise allows for very heavy loading'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Bench', 'Barbell Pad']
  },
  {
    id: 'plank',
    name: 'Plank',
    categories: ['Push'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    description: 'A fundamental core stability exercise that builds endurance.',
    instructions: [
      'Start in a push-up position or on your forearms',
      'Keep your body in a straight line',
      'Engage your core, glutes, and quads',
      'Avoid letting your hips sag or pike up',
      'Hold this position',
      'Breathe steadily throughout'
    ],
    tips: [
      'Quality over duration - maintain perfect form',
      'Squeeze everything - make your body rigid',
      'If your hips sag, take a break',
      'Progress to harder variations over time'
    ],
    difficulty: 'Beginner',
    equipment: ['Bodyweight']
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    categories: ['Legs', 'Calves'],
    thumbnail: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
    description: 'An isolation exercise that targets the calf muscles.',
    instructions: [
      'Stand on a raised surface with your heels hanging off',
      'Keep your legs straight',
      'Lower your heels below the platform',
      'Rise up onto your toes as high as possible',
      'Squeeze your calves at the top',
      'Lower with control and repeat'
    ],
    tips: [
      'Use a full range of motion - stretch and squeeze',
      'Pause at the top for maximum contraction',
      'Calves respond well to high reps',
      'Train them 2-3 times per week for growth'
    ],
    difficulty: 'Beginner',
    equipment: ['Calf Raise Machine', 'Step Platform']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    categories: ['Arms', 'Pull'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
    description: 'A bicep and forearm exercise with a neutral grip.',
    instructions: [
      'Stand with dumbbells at your sides',
      'Hold dumbbells with palms facing each other',
      'Keep your elbows close to your body',
      'Curl the weights up towards your shoulders',
      'Maintain the neutral grip throughout',
      'Lower with control to the starting position'
    ],
    tips: [
      'This variation targets the brachialis',
      'Avoid swinging the weights',
      'Keep your wrists straight',
      'Can be done alternating or simultaneously'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbells']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    categories: ['Pull', 'Back'],
    thumbnail: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=UCXxvVItLoM',
    description: 'A horizontal pulling exercise that builds back thickness.',
    instructions: [
      'Sit at the cable row station',
      'Plant your feet on the platform',
      'Grab the handle with both hands',
      'Start with arms fully extended',
      'Pull the handle towards your torso',
      'Squeeze your shoulder blades together at the end'
    ],
    tips: [
      'Keep your torso upright throughout',
      'Avoid using momentum by rocking back',
      'Pull with your elbows, not your hands',
      'Focus on the squeeze at the end of each rep'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine', 'Row Handle']
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=MeHQ4lVbS4I',
    description: 'A beginner-friendly squat variation that teaches proper form.',
    instructions: [
      'Hold a dumbbell vertically at chest height',
      'Stand with feet slightly wider than shoulder-width',
      'Keep your elbows pointing down',
      'Squat down between your legs',
      'Keep your chest up and core braced',
      'Drive through your heels to stand'
    ],
    tips: [
      'Great for learning squat mechanics',
      'The weight helps counterbalance you',
      'Use your elbows to push your knees out',
      'Aim for deep squats with good form'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbell']
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crushers',
    categories: ['Push', 'Arms'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
    description: 'An isolation exercise that effectively targets the triceps.',
    instructions: [
      'Lie on a bench holding a barbell or dumbbells',
      'Extend your arms straight above your chest',
      'Keep your upper arms stationary',
      'Lower the weight towards your forehead',
      'Bend only at the elbows',
      'Extend your arms back to the starting position'
    ],
    tips: [
      'Keep your upper arms perpendicular to your body',
      'Control the descent to protect your elbows',
      'Can be done with EZ bar, barbell, or dumbbells',
      'Lower behind your head for extra stretch'
    ],
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Bench', 'EZ Bar (Optional)']
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    categories: ['Legs', 'Quads', 'Glutes'],
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=NBY9-kTuHEk',
    description: 'An explosive plyometric exercise that builds power and athleticism.',
    instructions: [
      'Stand facing a sturdy box or platform',
      'Get into a quarter squat position',
      'Swing your arms back',
      'Explosively jump onto the box',
      'Land softly with knees bent',
      'Step down carefully and repeat'
    ],
    tips: [
      'Start with a low box and progress gradually',
      'Focus on landing softly, not jumping high',
      'Fully extend your hips at the top',
      'Step down - don\'t jump down to save your joints'
    ],
    difficulty: 'Intermediate',
    equipment: ['Plyo Box', 'Platform']
  },
  {
    id: 'farmers-walk',
    name: 'Farmer\'s Walk',
    categories: ['Pull', 'Back', 'Legs'],
    thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=rt17lmnaLSM',
    description: 'A loaded carry that builds total body strength and grip.',
    instructions: [
      'Pick up heavy dumbbells or kettlebells',
      'Stand tall with weights at your sides',
      'Keep your shoulders back and core braced',
      'Walk forward with controlled steps',
      'Maintain good posture throughout',
      'Walk for distance or time'
    ],
    tips: [
      'Keep your chest up and shoulders back',
      'Don\'t let the weights pull you forward',
      'Take steady, controlled steps',
      'Excellent for grip strength and core stability'
    ],
    difficulty: 'Beginner',
    equipment: ['Dumbbells', 'Kettlebells']
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    categories: ['Push'],
    thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    description: 'An effective weighted ab exercise that allows for progressive overload.',
    instructions: [
      'Kneel below a high cable with a rope attachment',
      'Hold the rope beside your head',
      'Keep your hips stationary',
      'Crunch down, bringing your elbows towards your knees',
      'Squeeze your abs at the bottom',
      'Return with control to the starting position'
    ],
    tips: [
      'Focus on using your abs, not your arms',
      'Keep the movement controlled',
      'Your hips shouldn\'t move',
      'Exhale as you crunch down'
    ],
    difficulty: 'Beginner',
    equipment: ['Cable Machine', 'Rope Attachment']
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    categories: ['Push', 'Chest', 'Arms'],
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    description: 'A fundamental bodyweight pushing exercise that builds upper body strength.',
    instructions: [
      'Start in a high plank position',
      'Hands slightly wider than shoulder-width',
      'Keep your body in a straight line',
      'Lower your chest towards the ground',
      'Keep your elbows at 45 degrees',
      'Push back up to the starting position'
    ],
    tips: [
      'Engage your core and glutes throughout',
      'Don\'t let your hips sag or pike up',
      'Full range of motion is important',
      'Modify on knees if needed'
    ],
    difficulty: 'Beginner',
    equipment: ['Bodyweight']
  }
];

export const CATEGORIES: ExerciseCategory[] = [
  'Push',
  'Pull',
  'Legs',
  'Arms',
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves'
];
