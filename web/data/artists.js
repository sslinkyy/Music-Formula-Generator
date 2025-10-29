// Curated minimal artist reference library for parsing stylistic cues
export const ARTIST_PROFILES = [
  {
    name: 'Drake',
    accent: 'American English (General)',
    genres: [ ['trap', 40], ['r&b', 30], ['pop', 30] ],
    tempo: '88-104 bpm feel',
    styleTags: 'melodic rap, introspective, catchy refrains, atmospheric pads, modern 808s',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'late-night, city lights, reflective, status',
    exclude: ''
  },
  {
    name: 'The Weeknd',
    accent: 'American English (General)',
    genres: [ ['r&b', 50], ['synthwave', 25], ['pop', 25] ],
    tempo: '90-120 bpm feel',
    styleTags: '80s tint, falsetto hooks, glossy synths, reverb-lush',
    instruments: ['synth pad','synth lead','rhodes','drum kit','snare','kick','strings'],
    keywords: 'neon, midnight drive, desire',
    exclude: ''
  },
  {
    name: 'Bad Bunny',
    accent: 'Spanish (Latin America)',
    genres: [ ['reggaeton', 60], ['moombahton', 20], ['trap', 20] ],
    tempo: '88-104 bpm feel',
    styleTags: 'dembow groove, chant-ready, latin slang flips, club energy',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'club, island, night',
    exclude: ''
  },
  {
    name: 'Burna Boy',
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 70], ['dancehall', 15], ['pop', 15] ],
    tempo: '96-108 bpm feel',
    styleTags: 'syncopated percussion, warm melody, chantable hooks',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'vibes, celebration, Lagos',
    exclude: ''
  },
  {
    name: 'Kendrick Lamar',
    accent: 'American English (West Coast)',
    genres: [ ['boom bap', 40], ['trap', 30], ['jazz rap', 30] ],
    tempo: '84-100 bpm feel',
    styleTags: 'storytelling, dense internals, switch-up cadences, theatrical',
    instruments: ['drum kit','snare','kick','piano','rhodes','strings'],
    keywords: 'narrative, city, moral conflict',
    exclude: ''
  },
  {
    name: 'Taylor Swift',
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['indie pop', 20], ['country', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'lyrical clarity, storytelling, big choruses',
    instruments: ['piano','acoustic guitar','strings','drum kit','snare','kick'],
    keywords: 'diary, seasons, colors',
    exclude: ''
  },
  {
    name: 'Travis Scott',
    accent: 'American English (General)',
    genres: [ ['trap', 60], ['edm', 20], ['pop', 20] ],
    tempo: '120-150 bpm half/quarter-time feel',
    styleTags: 'ad-lib heavy, atmospheric, hard 808s, autotuned motifs',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad','fx riser'],
    keywords: 'festival, night, astral',
    exclude: ''
  },
  {
    name: 'Pop Smoke',
    accent: 'American English (New York)',
    genres: [ ['drill', 80], ['trap', 20] ],
    tempo: '138-146 bpm feel (half-time rap)',
    styleTags: 'sliding 808s, triplet hats, gritty tone',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth lead'],
    keywords: 'city blocks, woo, grayscale',
    exclude: ''
  },
  {
    name: 'Central Cee',
    accent: 'British English (London)',
    genres: [ ['drill', 70], ['uk garage', 15], ['pop', 15] ],
    tempo: '136-146 bpm feel (half-time rap)',
    styleTags: 'story-detail, UK slang, cool tone',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'streets, grind, perspective',
    exclude: ''
  },
  {
    name: 'Fred again..',
    accent: 'British English (RP)',
    genres: [ ['uk garage', 40], ['house', 30], ['pop', 30] ],
    tempo: '120-136 bpm feel',
    styleTags: 'chopped vox, emotional builds, 2-step swing',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','vocal chop','fx riser'],
    keywords: 'voice notes, nostalgia, bittersweet',
    exclude: ''
  },
  {
    name: 'SZA',
    accent: 'American English (General)',
    genres: [ ['r&b', 70], ['pop', 30] ],
    tempo: '70-100 bpm feel',
    styleTags: 'airy hooks, intimate tone, layered harmonies',
    instruments: ['rhodes','piano','strings','drum kit','snare','kick'],
    keywords: 'love, self, space',
    exclude: ''
  },
  {
    name: 'Dua Lipa',
    accent: 'British English (RP)',
    genres: [ ['pop', 50], ['disco', 25], ['house', 25] ],
    tempo: '110-125 bpm feel',
    styleTags: 'dance-pop, punchy hooks, disco tint',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','strings'],
    keywords: 'dancefloor, sparkle, retro-modern',
    exclude: ''
  },
  {
    name: 'Ed Sheeran',
    accent: 'British English (RP)',
    genres: [ ['pop', 60], ['indie pop', 20], ['r&b', 20] ],
    tempo: '90-115 bpm feel',
    styleTags: 'acoustic bed, compact hooks, radio-ready',
    instruments: ['acoustic guitar','piano','drum kit','snare','kick'],
    keywords: 'love, home, small details',
    exclude: ''
  },
  {
    name: 'Beyoncé',
    accent: 'American English (General)',
    genres: [ ['r&b', 60], ['pop', 25], ['house', 15] ],
    tempo: '90-126 bpm feel',
    styleTags: 'power vocals, layered choirs, polished grooves',
    instruments: ['rhodes','piano','strings','choir','drum kit','claps','snare','kick'],
    keywords: 'empowerment, stage, elegance',
    exclude: ''
  }
  , {
    name: 'Tech N9ne',
    aliases: ['Tech9', 'Tech N9', 'Tech Nine', 'Tecca Nina', 'Tecca N9na', 'Strange Music'],
    accent: 'American English (Midwest)',
    genres: [ ['boom bap', 30], ['trap', 40], ['club rap', 30] ],
    tempo: '84-110 bpm feel',
    styleTags: 'chopper flow, dense internals, double-time bursts, theatrical hooks',
    instruments: ['drum kit','trap hats','snare','kick','808 bass','synth lead','strings'],
    keywords: 'Strange Music, Midwest, rapid-fire',
    exclude: ''
  }
  , {
    name: 'Beats Antique',
    aliases: ['BeatsAntique'],
    accent: 'American English (General)',
    genres: [ ['breakbeat', 35], ['future garage', 25], ['house', 20], ['ambient pop', 20] ],
    tempo: '90-125 bpm feel',
    styleTags: 'world-fusion textures, live instrumentation, bellydance beats, cinematic',
    instruments: ['drum kit','claps','snare','kick','strings','woodwinds','synth pad','vocal chop'],
    keywords: 'world, fusion, dance, cinematic',
    exclude: ''
  }
  , {
    name: 'Eminem',
    aliases: ['Slim Shady','Marshall Mathers'],
    accent: 'American English (Midwest)',
    genres: [ ['boom bap', 50], ['club rap', 20], ['trap', 30] ],
    tempo: '84-110 bpm feel',
    styleTags: 'punchlines, multis, storytelling, aggressive delivery',
    instruments: ['drum kit','snare','kick','piano','strings','808 bass','synth lead'],
    keywords: 'Detroit, narrative, shock lines',
    exclude: ''
  }
  , {
    name: 'J. Cole',
    aliases: ['J Cole'],
    accent: 'American English (General)',
    genres: [ ['boom bap', 45], ['trap', 35], ['r&b', 20] ],
    tempo: '86-104 bpm feel',
    styleTags: 'introspective, storytelling, soulful hooks',
    instruments: ['drum kit','snare','kick','piano','rhodes','strings'],
    keywords: 'Fayetteville, reflective, growth',
    exclude: ''
  }
  , {
    name: 'Lil Wayne',
    aliases: ['Weezy','Tunechi'],
    accent: 'American English (Southern)',
    genres: [ ['trap', 60], ['club rap', 40] ],
    tempo: '92-120 bpm feel',
    styleTags: 'punchlines, metaphors, playful flows',
    instruments: ['drum kit','trap hats','snare','kick','808 bass','synth lead'],
    keywords: 'New Orleans, witty, swagger',
    exclude: ''
  }
  , {
    name: 'Future',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['trap', 70], ['edm', 30] ],
    tempo: '120-150 bpm half/quarter-time feel',
    styleTags: 'autotuned motifs, atmospheric pads, 808 weight',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad','fx riser'],
    keywords: 'Atlanta, melodic, nocturnal',
    exclude: ''
  }
  , {
    name: 'Billie Eilish',
    aliases: ['Billie'],
    accent: 'American English (West Coast)',
    genres: [ ['pop', 50], ['synth pop', 30], ['ambient pop', 20] ],
    tempo: '70-110 bpm feel',
    styleTags: 'whisper-pop, dark pop, minimalism, intimate textures',
    instruments: ['rhodes','piano','synth pad','drum kit','snare','kick','strings'],
    keywords: 'moody, cinematic, close-mic',
    exclude: ''
  }
  , {
    name: 'Linkin Park',
    aliases: ['LP'],
    accent: 'American English (General)',
    genres: [ ['alt rock', 60], ['synth pop', 20], ['edm', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'nu-metal energy, rap/rock blend, anthemic hooks',
    instruments: ['drum kit','snare','kick','electric guitar','strings','synth pad','synth lead'],
    keywords: 'hybrid, angst, catharsis',
    exclude: ''
  }
  , {
    name: 'Skrillex',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['dubstep', 60], ['edm', 40] ],
    tempo: '126-150 bpm feel',
    styleTags: 'aggressive drops, vocal chops, modern sound design',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser','vocal chop'],
    keywords: 'bass, chop, drop',
    exclude: ''
  }
  , {
    name: 'Deadmau5',
    aliases: ['deadmau5','Joel Zimmerman'],
    accent: 'Canadian English',
    genres: [ ['house', 50], ['progressive trance', 50] ],
    tempo: '124-130 bpm feel',
    styleTags: 'progressive builds, clean sound, melodic leads',
    instruments: ['drum kit','claps','snare','kick','synth pad','synth lead','fx riser'],
    keywords: 'progressive, clean, melodic',
    exclude: ''
  }
  , {
    name: 'Disclosure',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['uk garage', 50], ['house', 50] ],
    tempo: '120-128 bpm feel',
    styleTags: '2-step swing, soulful vocals, modern house',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','vocal chop'],
    keywords: 'garage, vocal, groove',
    exclude: ''
  }
  , {
    name: 'Burial',
    aliases: [],
    accent: 'British English (London)',
    genres: [ ['future garage', 70], ['uk garage', 30] ],
    tempo: '120-140 bpm feel',
    styleTags: 'ghostly vox, vinyl crackle, moody atmospheres',
    instruments: ['drum kit','snare','kick','synth pad','vocal chop'],
    keywords: 'nocturnal, rain, memory',
    exclude: ''
  }
  , {
    name: 'Portishead',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['lo-fi chillhop', 50], ['ambient pop', 50] ],
    tempo: '70-100 bpm feel',
    styleTags: 'trip-hop feel, dusty textures, cinematic melancholy',
    instruments: ['drum kit','snare','kick','rhodes','synth pad','strings'],
    keywords: 'trip-hop, noir, cinematic',
    exclude: ''
  }
  , {
    name: 'Massive Attack',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['lo-fi chillhop', 50], ['ambient pop', 50] ],
    tempo: '70-100 bpm feel',
    styleTags: 'trip-hop pioneers, layered textures, dark atmosphere',
    instruments: ['drum kit','snare','kick','rhodes','synth pad','strings'],
    keywords: 'Bristol, trip-hop, layered',
    exclude: ''
  }
  , {
    name: 'BTS',
    aliases: ['Bangtan Boys'],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['r&b', 25], ['edm', 25] ],
    tempo: '100-126 bpm feel',
    styleTags: 'polished vocals, dance-pop energy, rap bridges',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','strings'],
    keywords: 'K-pop, choreography, bright',
    exclude: ''
  }
  , {
    name: 'BLACKPINK',
    aliases: ['Black Pink'],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['edm', 25], ['house', 25] ],
    tempo: '110-126 bpm feel',
    styleTags: 'bold hooks, dance drops, attitude',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'K-pop, fierce, fashion',
    exclude: ''
  }
  , {
    name: 'Rosalía',
    aliases: ['Rosalia'],
    accent: 'Spanish',
    genres: [ ['reggaeton', 50], ['moombahton', 20], ['pop', 30] ],
    tempo: '88-110 bpm feel',
    styleTags: 'flamenco-influenced pop, dembow rhythms, vocal flair',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'flamenco, fusion, modern',
    exclude: ''
  }
  , {
    name: 'Karol G',
    aliases: ['KarolG'],
    accent: 'Spanish',
    genres: [ ['reggaeton', 60], ['pop', 40] ],
    tempo: '90-110 bpm feel',
    styleTags: 'dembow hooks, confident delivery, radio-ready',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'reggaeton, empowerment, catchy',
    exclude: ''
  }
  , {
    name: 'Metro Boomin',
    aliases: ['Young Metro'],
    accent: 'American English (General)',
    genres: [ ['trap', 80], ['edm', 20] ],
    tempo: '120-150 bpm half/quarter-time feel',
    styleTags: 'cinematic intros, hard 808s, modern trap sound',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad','fx riser'],
    keywords: 'producer tag, cinematic, 808',
    exclude: ''
  }
  , {
    name: 'John Summit',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['tech house', 60], ['house', 40] ],
    tempo: '124-128 bpm feel',
    styleTags: 'club groove, vocal chops, rolling basslines',
    instruments: ['drum kit','claps','snare','kick','synth pad','pluck synth','vocal chop'],
    keywords: 'club, groove, peak-time',
    exclude: ''
  }
  , {
    name: 'FISHER',
    aliases: ['Fisher'],
    accent: 'Australian English',
    genres: [ ['tech house', 70], ['house', 30] ],
    tempo: '124-128 bpm feel',
    styleTags: 'minimal vocals, catchy drops, cheeky vibe',
    instruments: ['drum kit','claps','snare','kick','synth pad','pluck synth'],
    keywords: 'club, hooky, playful',
    exclude: ''
  }
  , {
    name: 'Peggy Gou',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['house', 60], ['techno', 40] ],
    tempo: '122-130 bpm feel',
    styleTags: 'retro-modern house, catchy vocals, groove-first',
    instruments: ['drum kit','claps','snare','kick','synth pad','synth lead'],
    keywords: 'club, groove, retro',
    exclude: ''
  }
  , {
    name: 'Ariana Grande',
    aliases: ['Ariana'],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['r&b', 20], ['edm', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'melodic pop, strong hooks, modern production',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','strings'],
    keywords: 'pop diva, vocal runs, polished',
    exclude: ''
  }
  , {
    name: 'Rihanna',
    aliases: ['RiRi'],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['r&b', 30], ['edm', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'anthemic hooks, glossy production, swagger',
    instruments: ['drum kit','claps','snare','kick','synth pad','synth lead','strings'],
    keywords: 'fashion, anthems, attitude',
    exclude: ''
  }
  , {
    name: 'Lady Gaga',
    aliases: ['Gaga'],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['house', 20], ['synth pop', 20] ],
    tempo: '100-126 bpm feel',
    styleTags: 'theatrical pop, strong choruses, dance influence',
    instruments: ['drum kit','claps','snare','kick','piano','synth pad','synth lead'],
    keywords: 'theatrical, fashion, club',
    exclude: ''
  }
  , {
    name: 'Katy Perry',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 70], ['edm', 30] ],
    tempo: '100-126 bpm feel',
    styleTags: 'radio pop, bright melodies, festival-ready',
    instruments: ['drum kit','claps','snare','kick','piano','synth lead','fx riser'],
    keywords: 'colorful, catchy, upbeat',
    exclude: ''
  }
  , {
    name: 'Justin Bieber',
    aliases: ['Bieber'],
    accent: 'Canadian English',
    genres: [ ['pop', 60], ['r&b', 20], ['edm', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'contemporary pop, falsetto hooks, smooth production',
    instruments: ['drum kit','snare','kick','piano','synth pad','strings'],
    keywords: 'radio, smooth, modern',
    exclude: ''
  }
  , {
    name: 'Olivia Rodrigo',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['alt rock', 40] ],
    tempo: '80-120 bpm feel',
    styleTags: 'emotive pop-rock, storytelling, dynamic shifts',
    instruments: ['drum kit','snare','kick','electric guitar','piano','strings'],
    keywords: 'breakout, emotive, youthful',
    exclude: ''
  }
  , {
    name: 'Harry Styles',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['pop', 60], ['synth pop', 20], ['rock', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'retro-pop, warm vocals, big choruses',
    instruments: ['drum kit','snare','kick','piano','synth pad','electric guitar'],
    keywords: 'retro, charm, melodic',
    exclude: ''
  }
  , {
    name: 'Adele',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['pop', 60], ['r&b', 40] ],
    tempo: '60-110 bpm feel',
    styleTags: 'ballad power, emotive vocals, classic pop',
    instruments: ['piano','strings','drum kit','snare','kick'],
    keywords: 'ballad, powerhouse, emotive',
    exclude: ''
  }
  , {
    name: 'Post Malone',
    aliases: ['Posty'],
    accent: 'American English (General)',
    genres: [ ['trap', 40], ['pop', 40], ['edm', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'melodic rap-pop, guitar textures, autotuned hooks',
    instruments: ['808 bass','drum kit','snare','kick','synth pad','electric guitar'],
    keywords: 'melodic, anthemic, catchy',
    exclude: ''
  }
  , {
    name: 'Kanye West',
    aliases: ['Ye'],
    accent: 'American English (General)',
    genres: [ ['boom bap', 30], ['trap', 40], ['synth pop', 30] ],
    tempo: '84-120 bpm feel',
    styleTags: 'innovative samples, bold concepts, switch-ups',
    instruments: ['drum kit','snare','kick','piano','strings','synth pad'],
    keywords: 'innovative, conceptual, sample-driven',
    exclude: ''
  }
  , {
    name: 'Jay-Z',
    aliases: ['Hov','JAY Z','JAY-Z'],
    accent: 'American English (East Coast)',
    genres: [ ['boom bap', 50], ['club rap', 30], ['trap', 20] ],
    tempo: '84-110 bpm feel',
    styleTags: 'lyricism, punchlines, refined swagger',
    instruments: ['drum kit','snare','kick','piano','strings'],
    keywords: 'New York, mogul, classic',
    exclude: ''
  }
  , {
    name: 'Lil Nas X',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['trap', 40], ['pop', 40], ['country', 20] ],
    tempo: '90-120 bpm feel',
    styleTags: 'genre-blend pop-rap, catchy hooks, viral sensibility',
    instruments: ['808 bass','drum kit','snare','kick','piano','synth pad'],
    keywords: 'viral, blend, catchy',
    exclude: ''
  }
  , {
    name: '21 Savage',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['trap', 70], ['club rap', 30] ],
    tempo: '92-120 bpm feel',
    styleTags: 'deadpan delivery, 808 weight, dark mood',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'minimal, street, dark',
    exclude: ''
  }
  , {
    name: 'Lil Baby',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['trap', 80], ['club rap', 20] ],
    tempo: '92-120 bpm feel',
    styleTags: 'melodic trap cadences, 808 focus, street tales',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'street, melodic, modern',
    exclude: ''
  }
  , {
    name: 'Doja Cat',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['trap', 30], ['edm', 20] ],
    tempo: '100-126 bpm feel',
    styleTags: 'playful hooks, rap-pop blend, modern drums',
    instruments: ['drum kit','snare','kick','synth pad','synth lead'],
    keywords: 'playful, catchy, rap-pop',
    exclude: ''
  }
  , {
    name: 'Nicki Minaj',
    aliases: ['Nicki'],
    accent: 'American English (General)',
    genres: [ ['trap', 50], ['club rap', 30], ['pop', 20] ],
    tempo: '92-126 bpm feel',
    styleTags: 'animated flows, punchlines, pop-rap hooks',
    instruments: ['808 bass','drum kit','snare','kick','synth pad','synth lead'],
    keywords: 'animated, rap-pop, punchy',
    exclude: ''
  }
  , {
    name: 'Cardi B',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['trap', 60], ['club rap', 40] ],
    tempo: '92-126 bpm feel',
    styleTags: 'attitude-forward, bold hooks, modern trap',
    instruments: ['808 bass','drum kit','snare','kick','synth pad'],
    keywords: 'bold, club, swagger',
    exclude: ''
  }
  , {
    name: 'Megan Thee Stallion',
    aliases: ['Megan'],
    accent: 'American English (Southern)',
    genres: [ ['trap', 60], ['club rap', 40] ],
    tempo: '92-126 bpm feel',
    styleTags: 'confident delivery, club hooks, Southern energy',
    instruments: ['808 bass','drum kit','snare','kick','synth pad'],
    keywords: 'confident, club, southern',
    exclude: ''
  }
  , {
    name: 'Young Thug',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['trap', 70], ['club rap', 30] ],
    tempo: '92-150 bpm feel',
    styleTags: 'experimental melodies, modern trap drums',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'melodic, experimental, trap',
    exclude: ''
  }
  , {
    name: 'Gunna',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['trap', 80], ['club rap', 20] ],
    tempo: '92-126 bpm feel',
    styleTags: 'melodic trap, clean cadences, glossy vibe',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'melodic, glossy, modern',
    exclude: ''
  }
  , {
    name: 'A$AP Rocky',
    aliases: ['ASAP Rocky'],
    accent: 'American English (General)',
    genres: [ ['trap', 50], ['boom bap', 20], ['club rap', 30] ],
    tempo: '92-126 bpm feel',
    styleTags: 'fashion-forward, varied flows, modern beats',
    instruments: ['808 bass','drum kit','snare','kick','synth pad','strings'],
    keywords: 'fashion, varied, modern',
    exclude: ''
  }
  , {
    name: 'Lil Uzi Vert',
    aliases: ['Uzi'],
    accent: 'American English (General)',
    genres: [ ['trap', 80], ['edm', 20] ],
    tempo: '120-150 bpm half/quarter-time feel',
    styleTags: 'hyper-melodic trap, festival energy',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth lead'],
    keywords: 'hyper, festival, melodic',
    exclude: ''
  }
  , {
    name: 'Playboi Carti',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['trap', 90], ['edm', 10] ],
    tempo: '120-150 bpm half/quarter-time feel',
    styleTags: 'minimalist trap, ad-lib driven, punk energy',
    instruments: ['808 bass','drum kit','trap hats','snare','kick','synth pad'],
    keywords: 'minimal, ad-libs, punk energy',
    exclude: ''
  }
  , {
    name: 'Juice WRLD',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['trap', 60], ['pop', 40] ],
    tempo: '90-120 bpm feel',
    styleTags: 'emo-rap melodies, freestyle feel, catchy hooks',
    instruments: ['808 bass','drum kit','snare','kick','synth pad','electric guitar'],
    keywords: 'emo-rap, melodic, freestyle',
    exclude: ''
  }
  , {
    name: 'XXXTENTACION',
    aliases: ['XXX','X'],
    accent: 'American English (General)',
    genres: [ ['trap', 50], ['alt rock', 30], ['lo-fi chillhop', 20] ],
    tempo: '70-150 bpm feel',
    styleTags: 'raw emotion, genre-bending, minimal beats',
    instruments: ['808 bass','drum kit','snare','kick','electric guitar','piano'],
    keywords: 'raw, emotive, minimal',
    exclude: ''
  }
  , {
    name: 'Coldplay',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['pop', 40], ['synth pop', 30], ['alt rock', 30] ],
    tempo: '80-126 bpm feel',
    styleTags: 'anthemic choruses, uplifting vibe, atmospheric',
    instruments: ['drum kit','snare','kick','piano','synth pad','strings','electric guitar'],
    keywords: 'anthemic, uplifting, stadium',
    exclude: ''
  }
  , {
    name: 'Imagine Dragons',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 60], ['synth pop', 40] ],
    tempo: '90-126 bpm feel',
    styleTags: 'stadium rock-pop, big drums, soaring hooks',
    instruments: ['drum kit','snare','kick','electric guitar','synth pad','strings'],
    keywords: 'stadium, big, soaring',
    exclude: ''
  }
  , {
    name: 'Maroon 5',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['funk', 10], ['synth pop', 30] ],
    tempo: '100-126 bpm feel',
    styleTags: 'radio pop, funk-lite grooves, catchy choruses',
    instruments: ['drum kit','snare','kick','piano','synth pad','electric guitar'],
    keywords: 'radio, catchy, polished',
    exclude: ''
  }
  , {
    name: 'OneRepublic',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['synth pop', 40] ],
    tempo: '90-126 bpm feel',
    styleTags: 'anthemic pop, clean production, big hooks',
    instruments: ['drum kit','snare','kick','piano','synth pad','strings'],
    keywords: 'anthemic, radio, clean',
    exclude: ''
  }
  , {
    name: 'Arctic Monkeys',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['alt rock', 80], ['synth pop', 20] ],
    tempo: '80-140 bpm feel',
    styleTags: 'indie rock vibe, clever lyrics, swagger',
    instruments: ['drum kit','snare','kick','electric guitar','bass guitar'],
    keywords: 'indie, swagger, clever',
    exclude: ''
  }
  , {
    name: 'The 1975',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['synth pop', 60], ['pop', 40] ],
    tempo: '90-126 bpm feel',
    styleTags: '80s sheen, witty lyrics, guitar-pop',
    instruments: ['drum kit','snare','kick','synth pad','electric guitar'],
    keywords: '80s, witty, guitar-pop',
    exclude: ''
  }
  , {
    name: 'Twenty One Pilots',
    aliases: ['21 Pilots'],
    accent: 'American English (General)',
    genres: [ ['alt rock', 40], ['synth pop', 30], ['trap', 30] ],
    tempo: '80-140 bpm feel',
    styleTags: 'genre-blend, rap-rock-pop, anthemic',
    instruments: ['drum kit','snare','kick','electric guitar','synth pad'],
    keywords: 'genre-blend, anthemic, modern',
    exclude: ''
  }
  , {
    name: 'Metallica',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['metal', 80], ['alt rock', 20] ],
    tempo: '90-180 bpm feel',
    styleTags: 'heavy riffs, precise drums, stadium metal',
    instruments: ['drum kit','snare','kick','electric guitar','strings'],
    keywords: 'heavy, precise, stadium',
    exclude: ''
  }
  , {
    name: 'Green Day',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 80], ['pop', 20] ],
    tempo: '100-180 bpm feel',
    styleTags: 'punk-pop energy, catchy choruses, guitar-driven',
    instruments: ['drum kit','snare','kick','electric guitar'],
    keywords: 'punk-pop, energy, catchy',
    exclude: ''
  }
  , {
    name: 'Foo Fighters',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 80], ['rock', 20] ],
    tempo: '100-180 bpm feel',
    styleTags: 'arena rock, driving drums, big guitars',
    instruments: ['drum kit','snare','kick','electric guitar'],
    keywords: 'arena, driving, big guitars',
    exclude: ''
  }
  , {
    name: 'Red Hot Chili Peppers',
    aliases: ['RHCP'],
    accent: 'American English (General)',
    genres: [ ['alt rock', 80], ['funk', 20] ],
    tempo: '90-150 bpm feel',
    styleTags: 'funk-rock, melodic, groove-led',
    instruments: ['drum kit','snare','kick','electric guitar','bass guitar'],
    keywords: 'funk-rock, groove, melodic',
    exclude: ''
  }
  , {
    name: 'Muse',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['alt rock', 80], ['synth pop', 20] ],
    tempo: '90-160 bpm feel',
    styleTags: 'bombastic rock, synth-infused, theatrical',
    instruments: ['drum kit','snare','kick','electric guitar','synth pad'],
    keywords: 'bombastic, synth-rock, theatrical',
    exclude: ''
  }
  , {
    name: 'Radiohead',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['alt rock', 60], ['ambient pop', 40] ],
    tempo: '70-140 bpm feel',
    styleTags: 'experimental rock, moody textures, art-pop',
    instruments: ['drum kit','snare','kick','electric guitar','synth pad'],
    keywords: 'experimental, moody, art-pop',
    exclude: ''
  }
  , {
    name: 'Nirvana',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 100] ],
    tempo: '90-160 bpm feel',
    styleTags: 'grunge, raw energy, heavy guitars',
    instruments: ['drum kit','snare','kick','electric guitar'],
    keywords: 'grunge, raw, heavy',
    exclude: ''
  }
  , {
    name: 'Deftones',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 80], ['shoegaze', 20] ],
    tempo: '90-150 bpm feel',
    styleTags: 'alt-metal, dreamy textures, heavy dynamics',
    instruments: ['drum kit','snare','kick','electric guitar','synth pad'],
    keywords: 'heavy, dreamy, alt-metal',
    exclude: ''
  }
  , {
    name: 'Tool',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['alt rock', 80], ['metal', 20] ],
    tempo: '90-150 bpm feel',
    styleTags: 'progressive metal, polyrhythms, moody dynamics',
    instruments: ['drum kit','snare','kick','electric guitar','strings'],
    keywords: 'progressive, polyrhythm, moody',
    exclude: ''
  }
  , {
    name: 'Morgan Wallen',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['country', 100] ],
    tempo: '80-140 bpm feel',
    styleTags: 'modern country, radio hooks, storytelling',
    instruments: ['acoustic guitar','piano','drum kit','snare','kick','strings'],
    keywords: 'country, radio, hooks',
    exclude: ''
  }
  , {
    name: 'Luke Combs',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['country', 100] ],
    tempo: '80-140 bpm feel',
    styleTags: 'anthemic country, strong vocals, heartland',
    instruments: ['acoustic guitar','drum kit','snare','kick','strings'],
    keywords: 'anthemic, country, heartland',
    exclude: ''
  }
  , {
    name: 'Chris Stapleton',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['country', 100] ],
    tempo: '70-120 bpm feel',
    styleTags: 'soulful country, blues influence, storytelling',
    instruments: ['acoustic guitar','drum kit','snare','kick','strings'],
    keywords: 'soulful, blues, country',
    exclude: ''
  }
  , {
    name: 'Zach Bryan',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['country', 100] ],
    tempo: '70-120 bpm feel',
    styleTags: 'americana, storytelling, heartfelt',
    instruments: ['acoustic guitar','drum kit','snare','kick','strings'],
    keywords: 'americana, heartfelt, storytelling',
    exclude: ''
  }
  , {
    name: 'Carrie Underwood',
    aliases: [],
    accent: 'American English (Southern)',
    genres: [ ['country', 100] ],
    tempo: '80-140 bpm feel',
    styleTags: 'powerhouse vocals, country-pop, anthemic',
    instruments: ['acoustic guitar','drum kit','snare','kick','strings','piano'],
    keywords: 'powerhouse, country-pop, anthemic',
    exclude: ''
  }
  , {
    name: 'Wizkid',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 100] ],
    tempo: '96-108 bpm feel',
    styleTags: 'afrobeats groove, melodic hooks, sunny vibe',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'afrobeats, groove, sunny',
    exclude: ''
  }
  , {
    name: 'Davido',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 100] ],
    tempo: '96-108 bpm feel',
    styleTags: 'afrobeats anthems, chant-ready, celebratory',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'afrobeats, anthems, celebratory',
    exclude: ''
  }
  , {
    name: 'Rema',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 100] ],
    tempo: '96-108 bpm feel',
    styleTags: 'melodic afrobeats, fresh hooks, smooth vocal',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'fresh, smooth, afrobeats',
    exclude: ''
  }
  , {
    name: 'Tems',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 60], ['r&b', 40] ],
    tempo: '90-108 bpm feel',
    styleTags: 'soulful afrobeats, airy vocals, minimalist textures',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad'],
    keywords: 'soulful, airy, minimalist',
    exclude: ''
  }
  , {
    name: 'Asake',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 100] ],
    tempo: '96-108 bpm feel',
    styleTags: 'log drums, chant hooks, high energy',
    instruments: ['drum kit','claps','snare','kick','vocal chop'],
    keywords: 'log drums, chant, energy',
    exclude: ''
  }
  , {
    name: 'Ayra Starr',
    aliases: [],
    accent: 'Nigerian English',
    genres: [ ['afrobeats', 100] ],
    tempo: '96-108 bpm feel',
    styleTags: 'melodic afrobeats, fresh hooks, youthful vibe',
    instruments: ['drum kit','claps','snare','kick','rhodes','synth pad','vocal chop'],
    keywords: 'youthful, fresh, afrobeats',
    exclude: ''
  }
  , {
    name: 'J Balvin',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['reggaeton', 70], ['pop', 30] ],
    tempo: '88-110 bpm feel',
    styleTags: 'reggaeton anthems, pop sensibility, polished',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'reggaeton, polished, anthems',
    exclude: ''
  }
  , {
    name: 'Maluma',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['reggaeton', 70], ['pop', 30] ],
    tempo: '88-110 bpm feel',
    styleTags: 'smooth vocals, reggaeton-pop, romantic vibe',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'smooth, romantic, reggaeton',
    exclude: ''
  }
  , {
    name: 'Ozuna',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['reggaeton', 80], ['pop', 20] ],
    tempo: '88-110 bpm feel',
    styleTags: 'melodic reggaeton, catchy hooks, clean production',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'melodic, catchy, reggaeton',
    exclude: ''
  }
  , {
    name: 'Anuel AA',
    aliases: ['Anuel'],
    accent: 'Spanish',
    genres: [ ['reggaeton', 80], ['trap', 20] ],
    tempo: '88-110 bpm feel',
    styleTags: 'gritty reggaeton-trap, bold hooks, deep 808s',
    instruments: ['drum kit','claps','snare','kick','808 bass','synth lead'],
    keywords: 'gritty, bold, deep 808s',
    exclude: ''
  }
  , {
    name: 'Daddy Yankee',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['reggaeton', 100] ],
    tempo: '88-110 bpm feel',
    styleTags: 'reggaeton pioneer, chant hooks, club energy',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'pioneer, chant, club energy',
    exclude: ''
  }
  , {
    name: 'Feid',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['reggaeton', 80], ['pop', 20] ],
    tempo: '88-110 bpm feel',
    styleTags: 'cool reggaeton-pop, melodic hooks',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'cool, melodic, reggaeton',
    exclude: ''
  }
  , {
    name: 'Rauw Alejandro',
    aliases: ['Rauw'],
    accent: 'Spanish',
    genres: [ ['reggaeton', 60], ['pop', 40] ],
    tempo: '88-110 bpm feel',
    styleTags: 'dance-ready reggaeton-pop, falsetto hooks',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'dance-ready, falsetto, reggaeton-pop',
    exclude: ''
  }
  , {
    name: 'Shakira',
    aliases: [],
    accent: 'Spanish',
    genres: [ ['pop', 50], ['reggaeton', 30], ['dancehall', 20] ],
    tempo: '88-120 bpm feel',
    styleTags: 'latin-pop fusion, strong hooks, dance influence',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'latin-pop, fusion, dance',
    exclude: ''
  }
  , {
    name: 'Anitta',
    aliases: [],
    accent: 'Portuguese',
    genres: [ ['pop', 50], ['reggaeton', 30], ['funk', 20] ],
    tempo: '88-120 bpm feel',
    styleTags: 'brazilian pop, reggaeton-funk fusion, club hooks',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'brazilian, fusion, club',
    exclude: ''
  }
  , {
    name: 'Becky G',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['reggaeton', 50] ],
    tempo: '88-120 bpm feel',
    styleTags: 'reggaeton-pop blend, duet-friendly, catchy',
    instruments: ['drum kit','claps','snare','kick','synth lead','vocal chop'],
    keywords: 'duet, catchy, reggaeton-pop',
    exclude: ''
  }
  , {
    name: 'Calvin Harris',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['house', 60], ['edm', 40] ],
    tempo: '122-128 bpm feel',
    styleTags: 'radio house, bright leads, vocal features',
    instruments: ['drum kit','claps','snare','kick','synth pad','synth lead','fx riser'],
    keywords: 'radio house, bright, features',
    exclude: ''
  }
  , {
    name: 'David Guetta',
    aliases: [],
    accent: 'French',
    genres: [ ['house', 50], ['edm', 50] ],
    tempo: '122-128 bpm feel',
    styleTags: 'festival house, vocal anthems, strong drops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'festival, vocal, drops',
    exclude: ''
  }
  , {
    name: 'Martin Garrix',
    aliases: [],
    accent: 'Dutch',
    genres: [ ['edm', 60], ['house', 40] ],
    tempo: '124-128 bpm feel',
    styleTags: 'big room energy, melodic drops, vocal features',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'big room, melodic, features',
    exclude: ''
  }
  , {
    name: 'Marshmello',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['edm', 50], ['pop', 50] ],
    tempo: '100-126 bpm feel',
    styleTags: 'pop-EDM blend, upbeat hooks, clean drops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser','vocal chop'],
    keywords: 'upbeat, clean, pop-EDM',
    exclude: ''
  }
  , {
    name: 'Alan Walker',
    aliases: [],
    accent: 'British English (RP)',
    genres: [ ['edm', 50], ['synth pop', 50] ],
    tempo: '100-126 bpm feel',
    styleTags: 'melodic EDM, emotive leads, vocal chops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','vocal chop'],
    keywords: 'melodic, emotive, chops',
    exclude: ''
  }
  , {
    name: 'Kygo',
    aliases: [],
    accent: 'Norwegian',
    genres: [ ['house', 50], ['edm', 50] ],
    tempo: '100-126 bpm feel',
    styleTags: 'tropical house, warm pads, piano leads',
    instruments: ['drum kit','claps','snare','kick','synth pad','piano','fx riser'],
    keywords: 'tropical, warm, piano',
    exclude: ''
  }
  , {
    name: 'Zedd',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['edm', 60], ['house', 40] ],
    tempo: '124-128 bpm feel',
    styleTags: 'precision EDM, strong toplines, bright drops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'precision, bright, toplines',
    exclude: ''
  }
  , {
    name: 'Tiësto',
    aliases: ['Tiesto'],
    accent: 'Dutch',
    genres: [ ['house', 50], ['trance', 50] ],
    tempo: '124-130 bpm feel',
    styleTags: 'club/trance pioneer, melodic drops, modern house',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'pioneer, melodic, modern house',
    exclude: ''
  }
  , {
    name: 'Armin van Buuren',
    aliases: ['Armin'],
    accent: 'Dutch',
    genres: [ ['trance', 70], ['edm', 30] ],
    tempo: '128-136 bpm feel',
    styleTags: 'uplifting trance, long builds, melodic leads',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'uplifting, builds, trance',
    exclude: ''
  }
  , {
    name: 'Avicii',
    aliases: [],
    accent: 'Swedish',
    genres: [ ['edm', 50], ['house', 50] ],
    tempo: '124-130 bpm feel',
    styleTags: 'melodic EDM, folk-pop fusion, anthems',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','acoustic guitar'],
    keywords: 'melodic, fusion, anthems',
    exclude: ''
  }
  , {
    name: 'DJ Snake',
    aliases: [],
    accent: 'French',
    genres: [ ['edm', 60], ['moombahton', 40] ],
    tempo: '100-126 bpm feel',
    styleTags: 'bass-heavy EDM, global fusions, festival-friendly',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser','vocal chop'],
    keywords: 'bass, fusion, festival',
    exclude: ''
  }
  , {
    name: 'Stray Kids',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['edm', 25], ['house', 25] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop energy, rap breaks, dance drops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad','fx riser'],
    keywords: 'K-pop, energy, rap breaks',
    exclude: ''
  }
  , {
    name: 'SEVENTEEN',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['edm', 25], ['house', 25] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop pop-dance, group vocals, bright hooks',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'group, bright, hooks',
    exclude: ''
  }
  , {
    name: 'TWICE',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['edm', 40] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop bright pop, dance-friendly, catchy',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'bright, catchy, K-pop',
    exclude: ''
  }
  , {
    name: 'NewJeans',
    aliases: ['New Jeans'],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['synth pop', 40] ],
    tempo: '100-126 bpm feel',
    styleTags: 'Y2K pop vibes, soft hooks, clean production',
    instruments: ['drum kit','claps','snare','kick','synth pad','strings'],
    keywords: 'Y2K, soft, clean',
    exclude: ''
  }
  , {
    name: 'EXO',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['edm', 25], ['house', 25] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop polished, vocal focus, dance',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'polished, vocal, dance',
    exclude: ''
  }
  , {
    name: 'NCT',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 50], ['edm', 25], ['house', 25] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop experimental, rap breaks, dynamic',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'experimental, rap breaks, K-pop',
    exclude: ''
  }
  , {
    name: 'TXT',
    aliases: ['Tomorrow X Together'],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['edm', 40] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop pop-dance, bright hooks, clean sound',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'pop-dance, bright, clean',
    exclude: ''
  }
  , {
    name: 'IVE',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['edm', 40] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop pop, bold hooks, modern drops',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'bold, modern, K-pop',
    exclude: ''
  }
  , {
    name: 'aespa',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['edm', 40] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop tech-pop, hard drops, futuristic vibe',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'tech-pop, futuristic, K-pop',
    exclude: ''
  }
  , {
    name: 'ITZY',
    aliases: [],
    accent: 'American English (General)',
    genres: [ ['pop', 60], ['edm', 40] ],
    tempo: '110-126 bpm feel',
    styleTags: 'K-pop confident pop, dance hooks, energetic',
    instruments: ['drum kit','claps','snare','kick','synth lead','synth pad'],
    keywords: 'confident, energetic, K-pop',
    exclude: ''
  }
];
