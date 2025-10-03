import { ACCENT_LIBRARY } from '../data/accents.js';
import { ACCENT_DEFAULT } from './config.js';

const NEUTRAL_INSTRUCTION = 'Neutral studio pronunciation; keep English lyrics natural.';

export function getPhoneticMode(accentName) {
  const raw = (accentName || '').trim() || ACCENT_DEFAULT;
  const accent = findAccent(raw);
  if (accent) {
    const instruction = ensureInstruction(accent.name, accent.instruction);
    const styleTag = accent.styleTag && accent.styleTag.length ? accent.styleTag : `accent: ${accent.name.toLowerCase()}`;
    return { label: accent.name, instruction: ensurePhoneticDirective(instruction), styleTag };
  }
  if (raw.toLowerCase() === ACCENT_DEFAULT.toLowerCase()) {
    return { label: raw, instruction: ensurePhoneticDirective(NEUTRAL_INSTRUCTION), styleTag: '' };
  }
  const instruction = `${raw} accent: emulate its signature cadence, vowels, and consonants while keeping lyrics in English.`;
  return { label: raw, instruction: ensurePhoneticDirective(instruction), styleTag: `accent: ${raw.toLowerCase()}` };
}

export function applyPhoneticSpelling(lines, accentLabel) {
  if (!Array.isArray(lines) || lines.length === 0) return lines;
  if (!accentLabel || accentLabel.trim().toLowerCase() === ACCENT_DEFAULT.toLowerCase()) return lines;
  return lines.map(line => phoneticTransformLine(line, accentLabel));
}

function ensureInstruction(name, instruction) {
  const trimmed = (instruction || '').trim();
  if (trimmed.length === 0) {
    return `${name} accent: emulate its cadence and pronunciation while keeping lyrics in English.`;
  }
  return trimmed;
}

function ensurePhoneticDirective(text) {
  if (text.toLowerCase().includes('write the lyrics phonetically')) {
    return text;
  }
  return `${text} Write the lyrics phonetically in this accent while keeping them in English.`;
}

function findAccent(name) {
  const lower = name.toLowerCase();
  return ACCENT_LIBRARY.find(item => item.name.toLowerCase() === lower);
}

function phoneticTransformLine(line, accentLabel) {
  const trimmed = (line || '').trim();
  if (!trimmed) return line;
  if (line.toLowerCase().includes('[producer tag]')) return line;
  if (trimmed.startsWith('[')) {
    const closeIndex = line.indexOf(']');
    if (closeIndex > -1 && closeIndex < line.length - 1) {
      const head = line.slice(0, closeIndex + 1);
      const tail = line.slice(closeIndex + 1);
      return head + phoneticTransformText(tail, accentLabel);
    }
    return line;
  }
  return phoneticTransformText(line, accentLabel);
}

function phoneticTransformText(text, accentLabel) {
  if (!text) return text;
  return text.split(' ').map(token => applyPhoneticToToken(token, accentLabel)).join(' ');
}

function applyPhoneticToToken(token, accentLabel) {
  if (!token) return token;
  let leading = '';
  let trailing = '';
  let core = token;
  while (core && !isLetterCharacter(core[0])) {
    leading += core[0];
    core = core.slice(1);
  }
  while (core && !isLetterCharacter(core[core.length - 1])) {
    trailing = core[core.length - 1] + trailing;
    core = core.slice(0, -1);
  }
  if (!core) return token;
  return leading + transformWordByPhonetic(core, accentLabel) + trailing;
}

function transformWordByPhonetic(word, accentLabel) {
  const lower = word.toLowerCase();
  let replacement;
  switch (accentLabel) {
    case 'Neutral / Standard':
      replacement = lower;
      break;
    case 'American English (General)':
      replacement = accentGeneral(lower);
      break;
    case 'American English (Southern)':
      replacement = accentSouthern(lower);
      break;
    case 'American English (New York)':
      replacement = accentNewYork(lower);
      break;
    case 'American English (Midwest)':
      replacement = accentMidwest(lower);
      break;
    case 'Spanish-Influenced English':
      replacement = accentSpanish(lower);
      break;
    case 'Indian English Accent':
      replacement = accentIndian(lower);
      break;
    case 'Somali English Accent':
      replacement = accentSomali(lower);
      break;
    default:
      replacement = lower;
  }
  return matchWordCase(word, replacement);
}

function matchWordCase(source, replacementLower) {
  if (!source) return replacementLower;
  if (source.length === 1 && source === source.toUpperCase()) {
    return replacementLower.charAt(0).toUpperCase() + replacementLower.slice(1);
  }
  if (source === source.toUpperCase()) {
    return replacementLower.toUpperCase();
  }
  if (source === source.toLowerCase()) {
    return replacementLower;
  }
  if (source[0] === source[0].toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()) {
    return replacementLower.charAt(0).toUpperCase() + replacementLower.slice(1);
  }
  return replacementLower;
}

function accentGeneral(lower) {
  let result = applyWordMap(lower, [
    ['and', "an'"],
    ['them', "'em"],
    ['because', "'cause"],
    ['about', "'bout"],
    ['around', "'round"],
    ['nothing', "nothin'"],
    ['something', "somethin'"],
    ['everything', "ev'rything"],
    ['going', "goin'"],
    ['doing', "doin'"],
    ['coming', "comin'"],
    ['your', 'yer'],
    ['you', 'ya'],
    ['you\'re', 'yer'],
    ['for', 'fer'],
    ['with', 'wit'],
    ['just', "jus'"],
    ['really', 'rilly'],
    ['of', 'uhv'],
    ['to', 'ta']
  ]);
  if (result.endsWith('ing') && result.length > 3) {
    result = result.slice(0, -3) + "in'";
  }
  result = applyPatternMap(result, [
    ['tion', 'shun'],
    ['ture', 'cher'],
    ['air', 'ehr'],
    ['ear', 'eer']
  ]);
  return result;
}

function accentSouthern(lower) {
  let result = accentGeneral(lower);
  result = applyWordMap(result, [
    ['my', 'mah'],
    ['mine', 'mahn'],
    ['i', 'ah'],
    ["i'm", "ah'm"],
    ["i'll", "ah'll"],
    ["i've", "ah've"],
    ['your', "yo'"],
    ["you're", "yo're"],
    ['are', 'ahr'],
    ['our', 'ahr'],
    ['fire', 'fahr'],
    ['time', 'tahm'],
    ['kind', 'kahnd'],
    ['friend', "frien'"],
    ['friends', "frien's"],
    ['there', 'theyah'],
    ['here', 'heah'],
    ['right', 'raht'],
    ['down', 'dahn'],
    ['out', 'owt']
  ]);
  if (result.endsWith('er')) {
    result = result.slice(0, -2) + 'ah';
  } else if (result.endsWith('r')) {
    result = result.slice(0, -1) + 'h';
  }
  result = applyPatternMap(result, [
    ['ight', 'aht'],
    ['own', 'ahn'],
    ['oil', 'awl']
  ]);
  return result;
}

function accentNewYork(lower) {
  let result = accentGeneral(lower);
  result = applyWordMap(result, [
    ['the', 'da'],
    ['this', 'dis'],
    ['that', 'dat'],
    ['these', 'dese'],
    ['those', 'dose'],
    ['coffee', 'caw-fee'],
    ['talk', 'tawk'],
    ['walk', 'wawk'],
    ['girl', 'goil'],
    ['world', 'woild'],
    ['car', 'caw'],
    ['far', 'faw'],
    ['hard', 'hawd'],
    ['party', 'pah-tee'],
    ['park', 'pawk'],
    ['water', 'waw-tuh']
  ]);
  if (result.endsWith('er')) {
    result = result.slice(0, -2) + 'uh';
  }
  if (result.endsWith('ar')) {
    result = result.slice(0, -2) + 'aw';
  }
  if (result.endsWith('ark')) {
    result = result.slice(0, -3) + 'awk';
  } else if (result.endsWith('art')) {
    result = result.slice(0, -3) + 'awt';
  }
  return result;
}

function accentMidwest(lower) {
  let result = accentGeneral(lower);
  result = applyWordMap(result, [
    ['about', 'uh-bowt'],
    ['out', 'owt'],
    ['sorry', 'sore-ee'],
    ['tomorrow', 'tuh-mar-oh'],
    ['bag', 'bayg'],
    ['flag', 'flayg'],
    ['dragon', 'dray-gun'],
    ['milk', 'melk'],
    ['pillow', 'pill-oh'],
    ['again', 'uh-gen']
  ]);
  result = applyPatternMap(result, [
    ['eg', 'ayg'],
    ['ag', 'ayg'],
    ['oo', 'ew']
  ]);
  return result;
}

function accentSpanish(lower) {
  let result = applyWordMap(lower, [
    ['people', 'peepul'],
    ['music', 'moo-seek'],
    ['party', 'par-tee'],
    ['very', 'bery'],
    ['brother', 'brodder'],
    ['another', 'anodder']
  ]);
  if (result.startsWith('v')) result = 'b' + result.slice(1);
  if (result.startsWith('j')) result = 'y' + result.slice(1);
  result = applyPatternMap(result, [
    ['ce', 'se'],
    ['ci', 'si'],
    ['ge', 'he'],
    ['gi', 'hi'],
    ['ll', 'y'],
    ['qu', 'k'],
    ['th', 't'],
    ['ph', 'f']
  ]);
  result = result.replace(/v/g, 'b').replace(/z/g, 's').replace(/r/g, 'rr').replace(/rrrr/g, 'rr');
  return result;
}

function accentIndian(lower) {
  let result = applyWordMap(lower, [
    ['water', 'vaw-tuh'],
    ['party', 'pahr-tee'],
    ['people', 'pee-pul'],
    ['power', 'pah-wer'],
    ['please', 'pleez']
  ]);
  result = result
    .replace(/th/g, 't')
    .replace(/ph/g, 'f')
    .replace(/tion/g, 'shun')
    .replace(/sion/g, 'zhun')
    .replace(/z/g, 'j')
    .replace(/w/g, 'v')
    .replace(/vv/g, 'v');
  return result;
}

function accentSomali(lower) {
  let result = accentGeneral(lower);
  result = applyWordMap(result, [
    ['my', "ma'"],
    ['mine', 'mahn'],
    ['i', 'ay'],
    ["i'm", "ay'm"],
    ["i'll", "ay'll"],
    ["i've", "ay've"],
    ['voice', 'voyss'],
    ['block', 'bloock'],
    ['sun', 'saawn'],
    ['crown', 'craawn'],
    ['from', 'frum'],
    ['coast', 'coost'],
    ['worldwide', 'worrldwyyyd'],
    ['city', 'siti'],
    ['never', 'nevvah'],
    ['ground', 'graawnd'],
    ['down', 'daawn'],
    ['now', 'naaw'],
    ['people', 'peepul'],
    ['brother', 'bruddah']
  ]);
  result = applyPatternMap(result, [
    ['tion', 'shun'],
    ['ough', 'oof'],
    ['igh', 'ay'],
    ['oo', 'uu'],
    ['ow', 'aaw'],
    ['ou', 'oo'],
    ['ea', 'ee'],
    ['ai', 'ay'],
    ['ck', 'kk']
  ]);
  return result;
}

function applyWordMap(base, map) {
  for (const [src, dst] of map) {
    if (base === src) return dst;
  }
  return base;
}

function applyPatternMap(text, map) {
  let result = text;
  for (const [src, dst] of map) {
    const pattern = new RegExp(src, 'g');
    result = result.replace(pattern, dst);
  }
  return result;
}

function isLetterCharacter(ch) {
  if (!ch) return false;
  const code = ch.toUpperCase().charCodeAt(0);
  return code >= 65 && code <= 90;
}
