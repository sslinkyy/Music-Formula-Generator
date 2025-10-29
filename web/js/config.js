export const CONSTANTS = [
  { id: 'phi', label: 'phi (phi)', value: (1 + Math.sqrt(5)) / 2 },
  { id: 'pi', label: 'pi (pi)', value: Math.PI },
  { id: 'e', label: 'e', value: Math.E }
];

export const CONTROLS = [
  { id: 'kappa', label: 'kappa (kappa)', value: 0.5, min: 0, max: 1 },
  { id: 'mu', label: 'mu (mu)', value: 0.6, min: 0, max: 1 },
  { id: 'lambda', label: 'lambda (lambda)', value: 1.0, min: 0, max: 2 }
];

export const DEFAULT_WEIGHTS = {
  core: 0.24,
  tech: 0.16,
  anthem: 0.2,
  style: 0.14,
  group: 0.14,
  perf: 0.12
};

export const CREATIVE_FIELDS = [
  { id: 'artistReference', label: 'Artist reference (e.g., Drake)', defaultValue: '' },
  { id: 'theme', label: 'Theme', defaultValue: '' },
  { id: 'keywords', label: 'Keywords (comma-separated)', defaultValue: '' },
  { id: 'mustInclude', label: 'Must-include words/phrases', defaultValue: '' },
  // Pre-populate common overused words to avoid; editable by user
  { id: 'forbidden', label: 'Forbidden words/phrases', defaultValue: 'glow, glitch, pulse' },
  { id: 'styleTags', label: 'Style/Mood tags (comma-separated)', defaultValue: 'anthemic rap, chant hook, pocket-tight flow' },
  { id: 'specificInstruments', label: 'Specific instruments (select or type)', defaultValue: '' },
  { id: 'lengthTarget', label: 'Length target (min)', defaultValue: 3 },
  { id: 'audienceNotes', label: 'Audience notes', defaultValue: '' },
  { id: 'externalDirectives', label: 'External directives (one per line)', defaultValue: '' }
];
export const WEIGHT_PRESETS = {
  street: { core: 0.27, tech: 0.21, anthem: 0.16, style: 0.14, group: 0.14, perf: 0.08 },
  club: { core: 0.21, tech: 0.1, anthem: 0.28, style: 0.12, group: 0.12, perf: 0.17 },
  backpack: { core: 0.22, tech: 0.23, anthem: 0.14, style: 0.17, group: 0.14, perf: 0.1 },
  streaming: { core: 0.27, tech: 0.12, anthem: 0.26, style: 0.12, group: 0.11, perf: 0.12 },
  defaults: DEFAULT_WEIGHTS
};

export const BASE_INPUTS = [
  { id: 'cadence', label: 'Cadence (C)', value: 9 },
  { id: 'feel', label: 'Feel (F)', value: 8 },
  { id: 'wordplay', label: 'Wordplay (W)', value: 8.5 },
  { id: 'lyricalDepth', label: 'Lyrical Depth (L)', value: 7 },
  { id: 'beatFit', label: 'Beat Fit (B)', value: 9 },
  { id: 'performance', label: 'Performance (P)', value: 8 },
  { id: 'structure', label: 'Structure (S)', value: 7.5 },
  { id: 'versatility', label: 'Versatility (V)', value: 6 },
  { id: 'anthemic', label: 'Anthemic (A)', value: 8.8 },
  { id: 'complexity', label: 'Complexity (X)', value: 7 },
  { id: 'style', label: 'Style (Y)', value: 8.2 }
];

export const DERIVED_INPUTS = [
  { id: 'rhymeEntropy', label: 'Rhyme Entropy H_rhyme', value: 0.65 },
  { id: 'multisPerBar', label: 'Multis per bar M_multi', value: 0.7 },
  { id: 'flowVariance', label: 'Flow Variance Var_flow', value: 0.5 },
  { id: 'chantability', label: 'Chantability Q_chant', value: 0.8 },
  { id: 'crowdResponse', label: 'Crowd Response R_crowd', value: 0.65 },
  { id: 'originality', label: 'Originality U', value: 0.7 },
  { id: 'timbreCohesion', label: 'Timbre Cohesion S_tone', value: 0.8 },
  { id: 'swaggerPhase', label: 'Swagger Phase phi (0-1)', value: 0.6 },
  { id: 'dynamicRange', label: 'Dynamic Range D', value: 0.7 },
  { id: 'cosineMatch', label: 'Cosine Match cos a (-1..1)', value: 0.75 },
  { id: 'phaseDrift', label: 'Phase Drift phi_f (fraction of pi)', value: 0.3 },
  { id: 'groupManual', label: 'Group Manual Fit G', value: 0.75 }
];

export const USER_SECTION_DEFS = [
  { id: 'titleIdea', label: 'Title idea' },
  { id: 'intro', label: 'Intro' },
  { id: 'hook', label: 'Hook / Chorus' },
  { id: 'verse1', label: 'Verse 1' },
  { id: 'verse2', label: 'Verse 2' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'outro', label: 'Outro' },
  { id: 'notes', label: 'Notes' }
];

export const PREMISE_OPTIONS = [
  '(custom)',
  'love & loyalty',
  'heartbreak & healing',
  'hustle & ambition',
  'betrayal & trust',
  'triumph & celebration',
  'redemption & growth',
  'city pride & belonging',
  'struggle & perseverance',
  // Expanded curated themes
  'freedom & escape',
  'nostalgia & memory',
  'rebellion & defiance',
  'self-discovery & identity',
  'faith & doubt',
  'ambition & sacrifice',
  'legacy & family',
  'loss & remembrance',
  'hope & renewal',
  'party & vibe',
  'long-distance & yearning',
  'mental health & healing',
  'money & power',
  'fame & pressure',
  'survival & street wisdom',
  'addiction & recovery',
  'betrayal & revenge',
  'underdog & come-up',
  'gratitude & humility',
  'nature & calm',
  'technology & isolation',
  'community & solidarity',
  'wanderlust & homecoming',
  '(auto)'
];

// Allow more genre slots in the mix
export const GENRE_SLOTS = 6;
export const GENRE_SLOT_WEIGHT_TOTAL = 100;
export const ACCENT_DEFAULT = 'Neutral / Standard';

export const DEFAULT_AI_SETTINGS = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  apiKey: '',
  organization: '',
  temperature: 0.9,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 1200,
  timeoutMs: 60000,
  systemPrompt: 'You are a lyrical assistant. Output only valid Suno blocks as instructed.',
  stopSequences: '',
  userLabel: '',
  responseFormat: '{"type":"text"}'
};


// Languages available for lyric output (plus custom)
export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Arabic',
  'Hindi',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
  'Cantonese',
  'Swahili',
  'Turkish',
  'Greek',
  'Russian',
  '(custom)'
];

// Suggested instrument list for multi-select UX
export const INSTRUMENT_OPTIONS = [
  '808 bass',
  'acoustic guitar',
  'electric guitar',
  'piano',
  'rhodes',
  'synth pad',
  'synth lead',
  'strings',
  'brass',
  'woodwinds',
  'pluck synth',
  'arp',
  'drum kit',
  'trap hats',
  'claps',
  'snare',
  'kick',
  'choir',
  'vocal chop',
  'fx riser'
];


