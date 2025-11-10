// Brick Breaker Integration Bridge
// Handles importing musical collectibles from the 3D Brick Breaker game

/**
 * Check if there's brick breaker data waiting to be imported
 * @returns {Object|null} Collections data or null if none/expired
 */
export function checkForBrickBreakerData() {
    try {
        const rawData = localStorage.getItem('musicGenerator_brickBreakerCollected');
        if (!rawData) return null;

        const { timestamp, version, collections, stats } = JSON.parse(rawData);

        // Only offer import if data is recent (< 7 days)
        const age = Date.now() - timestamp;
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        if (age > MAX_AGE) {
            console.log('[Bridge] Brick breaker data is too old, ignoring');
            return null;
        }

        // Validate data structure
        if (!collections || typeof collections !== 'object') {
            console.error('[Bridge] Invalid collections data structure');
            return null;
        }

        return { collections, stats, age, timestamp };
    } catch (e) {
        console.error('[Bridge] Error checking for brick breaker data:', e);
        return null;
    }
}

/**
 * Map brick breaker collections to Music Generator state format
 * @param {Object} collections - Brick breaker collections
 * @returns {Object} Mapped data for music generator
 */
export function mapBrickBreakerToState(collections) {
    const mapped = {
        genreMix: [],
        keywords: [],
        instruments: [],
        tempo: null
    };

    // Map genres to genre mix with even weight distribution
    if (collections.genre && collections.genre.length > 0) {
        const weight = Math.floor(100 / collections.genre.length);
        const remainder = 100 - (weight * collections.genre.length);

        collections.genre.forEach((genre, index) => {
            const slotWeight = weight + (index === 0 ? remainder : 0); // Add remainder to first
            mapped.genreMix.push({
                genre: genre,
                weight: slotWeight,
                customGenre: ''
            });
        });
    }

    // Map styles to keywords
    if (collections.style && collections.style.length > 0) {
        mapped.keywords.push(...collections.style.map(s => s.toLowerCase()));
    }

    // Map beats to keywords (e.g., "808 Hit" → "808 hit")
    if (collections.beat && collections.beat.length > 0) {
        mapped.keywords.push(...collections.beat.map(b => b.toLowerCase()));
    }

    // Map SFX to keywords (e.g., "Vinyl Crackle" → "vinyl crackle")
    if (collections.sfx && collections.sfx.length > 0) {
        mapped.keywords.push(...collections.sfx.map(s => s.toLowerCase()));
    }

    // Map melodies to keywords/instruments (e.g., "Piano Riff" → "piano")
    if (collections.melody && collections.melody.length > 0) {
        const instruments = collections.melody.map(m => {
            // Extract instrument name from descriptions like "Piano Riff", "Synth Lead"
            const match = m.match(/^([A-Za-z]+)/);
            return match ? match[1].toLowerCase() : m.toLowerCase();
        });
        mapped.instruments.push(...instruments);
        // Also add to keywords
        mapped.keywords.push(...collections.melody.map(m => m.toLowerCase()));
    }

    // Map tempo to keywords (e.g., "92-104 BPM" → "92-104 bpm")
    if (collections.tempo && collections.tempo.length > 0) {
        mapped.keywords.push(...collections.tempo.map(t => t.toLowerCase()));
        // Try to extract average BPM
        const firstTempo = collections.tempo[0];
        const match = firstTempo.match(/(\d+)-(\d+)/);
        if (match) {
            const avg = Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2);
            mapped.tempo = avg;
        }
    }

    // Remove duplicates from keywords
    mapped.keywords = [...new Set(mapped.keywords)];

    return mapped;
}

/**
 * Apply mapped brick breaker data to the current state
 * @param {Object} state - Current Music Generator state
 * @param {Object} mapped - Mapped brick breaker data
 * @returns {Object} Updated state
 */
export function applyBrickBreakerToState(state, mapped) {
    const updated = { ...state };

    // Merge genre mix (limit to 5 slots as per config)
    if (mapped.genreMix.length > 0) {
        const MAX_GENRE_SLOTS = 5;
        updated.genreMix = [
            ...mapped.genreMix.slice(0, MAX_GENRE_SLOTS)
        ];
    }

    // Merge keywords into creativeInputs
    // UI expects a comma-separated string in creativeInputs.keywords
    const tokens = [];
    if (updated.creativeInputs && updated.creativeInputs.keywords) {
        const existing = updated.creativeInputs.keywords;
        if (Array.isArray(existing)) {
            existing.forEach(x => { if (x && typeof x === 'string') tokens.push(x); });
        } else if (typeof existing === 'string') {
            existing.split(',').map(s => s.trim()).filter(Boolean).forEach(s => tokens.push(s));
        }
    }
    if (mapped.keywords && mapped.keywords.length) {
        mapped.keywords.forEach(s => { if (s && typeof s === 'string') tokens.push(s); });
    }
    if (mapped.tempo) {
        tokens.push(`${mapped.tempo} bpm`);
    }
    if (tokens.length) {
        const deduped = [...new Set(tokens.map(s => s.trim()))];
        updated.creativeInputs = updated.creativeInputs || {};
        updated.creativeInputs.keywords = deduped.join(', ');
    }

    return updated;
}

/**
 * Clear brick breaker data from localStorage after successful import
 */
export function clearBrickBreakerData() {
    try {
        localStorage.removeItem('musicGenerator_brickBreakerCollected');
        console.log('[Bridge] Cleared brick breaker data from localStorage');
    } catch (e) {
        console.error('[Bridge] Error clearing brick breaker data:', e);
    }
}

/**
 * Get human-readable age string
 * @param {number} ageMs - Age in milliseconds
 * @returns {string} Human-readable age
 */
export function getAgeString(ageMs) {
    const minutes = Math.floor(ageMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'just now';
}
