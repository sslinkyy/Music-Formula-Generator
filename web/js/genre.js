import { GENRE_LIBRARY } from '../data/genres.js';

export function analyzeGenreMix(slots) {
  const mix = buildMix(slots);
  if (mix.length === 0) {
    return { mix: [], found: false };
  }

  const tempoDict = collectWeightedValues(mix, 'tempo');
  const tempoHint = joinWeightedDict(tempoDict, ' | ') || 'Hybrid tempo blend';
  const structureHint = buildDominantValue(mix, 'structure');
  const excludeCsv = buildCsvUnion(mix, 'exclude', true);
  const sfxCsv = buildCsvUnion(mix, 'sfx', false);
  const mixSummary = buildMixSummary(mix);

  const styleDict = collectWeightedValues(mix, 'styleTags');
  mergeTempoIntoStyles(tempoDict, styleDict);
  const styleBlock = buildStyleBlockFromDynamic(styleDict) || '[custom genre blend]';
  const styleTagsCsv = buildCommaList(styleDict);

  const weights = mix.reduce((acc, item) => {
    acc.core += item.weights.core * item.weight;
    acc.tech += item.weights.tech * item.weight;
    acc.anthem += item.weights.anthem * item.weight;
    acc.style += item.weights.style * item.weight;
    acc.group += item.weights.group * item.weight;
    acc.perf += item.weights.perf * item.weight;
    return acc;
  }, { core: 0, tech: 0, anthem: 0, style: 0, group: 0, perf: 0 });

  const hasWeights = Object.values(weights).some(value => value > 0);

  return {
    mix,
    tempoHint,
    structureHint,
    excludeCsv,
    sfxCsv,
    mixSummary,
    styleBlock,
    styleTagsCsv,
    weights,
    weightsFound: hasWeights
  };
}

function buildMix(slots) {
  const entries = [];
  const library = GENRE_LIBRARY;
  for (const slot of slots) {
    const name = slot.genre?.trim();
    if (!name) continue;
    const genre = findGenreByName(library, name);
    if (!genre) continue;
    const weightRaw = Number(slot.weight) || 0;
    entries.push({
      name: genre.name,
      weightRaw,
      weight: 0,
      tempo: genre.tempo,
      structure: genre.structure,
      exclude: genre.exclude,
      sfx: genre.sfx,
      hookPlan: genre.hookPlan,
      flowPlan: genre.flowPlan,
      rhymePlan: genre.rhymePlan,
      styleTags: genre.styleTags,
      weights: { ...genre.weights }
    });
  }

  if (entries.length === 0) {
    return entries;
  }

  const positiveSum = entries.reduce((acc, item) => item.weightRaw > 0 ? acc + item.weightRaw : acc, 0);
  if (positiveSum > 0) {
    entries.forEach(item => {
      item.weight = item.weightRaw > 0 ? item.weightRaw / positiveSum : 0;
    });
  } else {
    const even = 1 / entries.length;
    entries.forEach(item => { item.weight = even; });
  }

  return entries;
}

function findGenreByName(list, name) {
  const lower = name.toLowerCase();
  return list.find(item => item.name.toLowerCase() === lower);
}

function buildMixSummary(mix) {
  return mix.map(item => `${(item.weight * 100).toFixed(0)}% ${item.name}`).join(' + ');
}

function collectWeightedValues(mix, field) {
  const dict = new Map();
  for (const item of mix) {
    const raw = (item[field] || '').trim();
    if (!raw) continue;
    const parts = field === 'styleTags' || field === 'exclude' || field === 'sfx' ? raw.split(',') : [raw];
    for (const rawPart of parts) {
      const label = rawPart.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const entry = dict.get(key);
      if (entry) {
        entry.weight += item.weight;
      } else {
        dict.set(key, { label, weight: item.weight });
      }
    }
  }
  return dict;
}

function mergeTempoIntoStyles(tempoDict, styleDict) {
  if (!tempoDict || !styleDict) return;
  for (const [key, tempoEntry] of tempoDict.entries()) {
    if (tempoEntry.weight <= 0) continue;
    const existing = styleDict.get(key);
    if (existing) {
      existing.weight += tempoEntry.weight * 0.5;
    } else {
      styleDict.set(key, { label: tempoEntry.label, weight: tempoEntry.weight * 0.5 });
    }
  }
}

function buildStyleBlockFromDynamic(styleDict) {
  if (!styleDict || styleDict.size === 0) return '';
  const entries = Array.from(styleDict.values()).sort((a, b) => b.weight - a.weight);
  const limit = Math.min(entries.length, 14);
  const body = entries.slice(0, limit).map(entry => entry.label).join(' | ');
  return `[${body}]`;
}

function buildCommaList(styleDict) {
  if (!styleDict || styleDict.size === 0) return '';
  const entries = Array.from(styleDict.values()).sort((a, b) => b.weight - a.weight);
  const limit = Math.min(entries.length, 12);
  return entries.slice(0, limit).map(entry => entry.label).join(', ');
}

function joinWeightedDict(dict, delimiter) {
  if (!dict || dict.size === 0) return '';
  const items = Array.from(dict.values()).sort((a, b) => b.weight - a.weight);
  return items.map(entry => `${(entry.weight * 100).toFixed(0)}% ${entry.label}`).join(delimiter);
}

function buildDominantValue(mix, fieldName) {
  let bestLabel = '';
  let bestWeight = 0;
  for (const entry of mix) {
    const candidate = (entry[fieldName] || '').trim();
    if (!candidate) continue;
    if (entry.weight >= bestWeight) {
      bestWeight = entry.weight;
      bestLabel = candidate;
    }
  }
  if (!bestLabel) return '';
  const alts = [];
  for (const entry of mix) {
    const candidate = (entry[fieldName] || '').trim();
    if (!candidate) continue;
    if (candidate.toLowerCase() !== bestLabel.toLowerCase()) {
      alts.push(`${(entry.weight * 100).toFixed(0)}% ${candidate}`);
    }
  }
  return alts.length ? `${bestLabel} (alts: ${alts.join(' / ')})` : bestLabel;
}

function buildCsvUnion(mix, fieldName, makeLower) {
  const seen = new Map();
  for (const entry of mix) {
    const raw = (entry[fieldName] || '').trim();
    if (!raw) continue;
    for (const tokenRaw of raw.split(',')) {
      const token = tokenRaw.trim();
      if (!token) continue;
      const key = token.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, makeLower ? key : token);
      }
    }
  }
  return Array.from(seen.values()).join(', ');
}
export function appendStyleAccent(styleBlock, accentTag) {
  const tag = (accentTag || '').trim();
  if (!tag) return styleBlock;
  const trimmed = (styleBlock || '').trim();
  if (!trimmed) {
    return `[${tag}]`;
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    let body = trimmed.slice(1, -1).trim();
    if (!body) {
      body = tag;
    } else if (!body.toLowerCase().includes(tag.toLowerCase())) {
      body = `${body} | ${tag}`;
    }
    return `[${body}]`;
  }
  if (!trimmed.toLowerCase().includes(tag.toLowerCase())) {
    const body = trimmed.length ? `${trimmed} | ${tag}` : tag;
    return `[${body}]`;
  }
  return `[${trimmed}]`;
}








