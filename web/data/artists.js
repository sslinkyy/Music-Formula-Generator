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
];
