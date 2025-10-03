import { CONSTANTS, DEFAULT_WEIGHTS } from './config.js';

export function computeScores(input) {
  const phi = CONSTANTS.find(c => c.id === 'phi').value;
  const pi = CONSTANTS.find(c => c.id === 'pi').value;
  const e = CONSTANTS.find(c => c.id === 'e').value;

  const { controls, weights = DEFAULT_WEIGHTS, baseInputs, derivedInputs } = input;
  const kappa = controls.kappa ?? 0.5;
  const mu = controls.mu ?? 0.6;
  const lambda = controls.lambda ?? 1.0;

  const norm = normalizeBaseInputs(baseInputs);
  const phiFRad = (derivedInputs.phaseDrift ?? 0) * pi;

  const blocks = {};
  blocks.core = safePower(
    norm.cadence ** phi *
      norm.wordplay ** Math.sqrt(pi) *
      norm.beatFit ** e *
      norm.structure ** Math.log(pi) *
      norm.feel ** Math.sqrt(phi),
    1 / (phi + Math.sqrt(pi) + e + Math.log(pi) + Math.sqrt(phi))
  );

  blocks.sync = (1 + Math.cos(phiFRad)) / 2;
  blocks.coreStar = safePower(blocks.core, phi / pi) * safePower(blocks.sync, Math.sqrt(phi));

  blocks.tech = (1 / (1 + Math.exp(-(pi * (derivedInputs.rhymeEntropy ?? 0) + Math.sqrt(phi) * Math.log(1 + e * (derivedInputs.multisPerBar ?? 0)))))) *
    Math.exp(kappa * (derivedInputs.flowVariance ?? 0));

  blocks.anthem = safePower(norm.anthemic ** phi * (derivedInputs.chantability ?? 0) ** Math.sqrt(2), 1 / (phi + Math.sqrt(2))) *
    (1 - Math.exp(-pi * (derivedInputs.crowdResponse ?? 0)));

  blocks.styleSig = Math.exp(mu * (derivedInputs.originality ?? 0)) *
    safePower((norm.style + (derivedInputs.timbreCohesion ?? 0)) / 2, Math.log(phi)) *
    (1 + (1 / pi) * Math.sin(pi * (derivedInputs.swaggerPhase ?? 0)));

  blocks.group = safePower((1 + (derivedInputs.cosineMatch ?? 0)) / 2, phi) *
    (1 / (1 + Math.exp(-Math.sqrt(pi) * (derivedInputs.groupManual ?? 0))));

  blocks.perf = safePower(norm.performance * safePower(derivedInputs.dynamicRange ?? 0, 1 / pi), Math.tanh(pi * norm.versatility / 2));

  blocks.regularizer = Math.exp(-lambda * Math.max(norm.complexity - ((phi - 1) / phi), 0) * pi);

  const weightSum =
    (weights.core ?? 0) +
    (weights.tech ?? 0) +
    (weights.anthem ?? 0) +
    (weights.style ?? 0) +
    (weights.group ?? 0) +
    (weights.perf ?? 0);

  const blended = safePower(
    safePower(blocks.coreStar, (weights.core ?? 0) * phi / pi) *
      safePower(blocks.tech, (weights.tech ?? 0) * pi / e) *
      safePower(blocks.anthem, (weights.anthem ?? 0) * Math.sqrt(phi)) *
      safePower(blocks.styleSig, (weights.style ?? 0) * Math.log(phi)) *
      safePower(blocks.group, (weights.group ?? 0) * e / pi) *
      safePower(blocks.perf, (weights.perf ?? 0) * Math.sqrt(pi)),
    1 / (weightSum || 1)
  );

  const finalScoreRaw = 100 * blended * blocks.regularizer;
  const finalScore = Math.max(0, Math.min(100, finalScoreRaw));

  return {
    normalized: norm,
    helper: { phiFRad },
    blocks,
    weights,
    weightSum,
    final: {
      raw: finalScoreRaw,
      clamped: finalScore
    }
  };
}

function normalizeBaseInputs(baseInputs = {}) {
  const get = (id) => (baseInputs?.[id] ?? 0) / 10;
  return {
    cadence: clamp01(get('cadence')),
    feel: clamp01(get('feel')),
    wordplay: clamp01(get('wordplay')),
    lyricalDepth: clamp01(get('lyricalDepth')),
    beatFit: clamp01(get('beatFit')),
    performance: clamp01(get('performance')),
    structure: clamp01(get('structure')),
    versatility: clamp01(get('versatility')),
    anthemic: clamp01(get('anthemic')),
    complexity: clamp01(get('complexity')),
    style: clamp01(get('style'))
  };
}

function clamp01(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safePower(base, exponent) {
  if (typeof base !== 'number' || typeof exponent !== 'number') return 0;
  const exp = Number(exponent);
  if (Math.abs(exp) < 1e-9) return 1;
  const b = Number(base);
  if (b <= 0) return 0;
  return Math.exp(exp * Math.log(b));
}

