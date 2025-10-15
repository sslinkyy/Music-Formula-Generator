// Generates web/music/manifest.json based on files in web/music
// Run in CI before uploading Pages artifact
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const musicDir = path.join(ROOT, 'web', 'music');
const manifestPath = path.join(musicDir, 'manifest.json');

function scan() {
  const files = fs.readdirSync(musicDir).filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
  const entries = files.map(f => {
    const id = path.parse(f).name;
    return {
      id,
      title: id.replace(/[_-]+/g, ' '),
      artist: '',
      file: `music/${f}`,
      bpm: null,
      offset: null,
      tags: []
    };
  });
  fs.writeFileSync(manifestPath, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`Wrote manifest with ${entries.length} entries to ${manifestPath}`);
}

scan();

