#!/usr/bin/env node
/**
 * Auto-generates manifest.json by scanning stepmania-packs folder for ZIP files
 * and extracting metadata from the .sm files inside each ZIP
 *
 * Usage: node generate-manifest.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const AdmZip = require('adm-zip');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const PACKS_DIR = __dirname;
const MANIFEST_PATH = path.join(PACKS_DIR, 'manifest.json');

/**
 * Parse StepMania .sm file to extract metadata
 */
function parseSmFile(content) {
  const metadata = {
    title: null,
    artist: null,
    subtitle: null,
    bpm: null,
    chartCount: 0
  };

  // Extract title
  const titleMatch = content.match(/#TITLE:([^;]+);/);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  // Extract artist
  const artistMatch = content.match(/#ARTIST:([^;]+);/);
  if (artistMatch) metadata.artist = artistMatch[1].trim();

  // Extract subtitle
  const subtitleMatch = content.match(/#SUBTITLE:([^;]+);/);
  if (subtitleMatch) metadata.subtitle = subtitleMatch[1].trim();

  // Extract BPM
  const bpmMatch = content.match(/#BPMS:([^;]+);/);
  if (bpmMatch) {
    const bpmStr = bpmMatch[1].trim();
    const bpmPairs = bpmStr.split(',');
    if (bpmPairs.length > 0) {
      const firstBpm = bpmPairs[0].split('=')[1];
      metadata.bpm = parseFloat(firstBpm) || null;
    }
  }

  // Count dance-single charts
  const notesRegex = /#NOTES:\s*dance-single[^;]*;/gi;
  const matches = content.match(notesRegex);
  metadata.chartCount = matches ? matches.length : 0;

  return metadata;
}

/**
 * Extract metadata from a ZIP file
 */
async function extractPackMetadata(zipPath) {
  try {
    console.log(`  Scanning: ${path.basename(zipPath)}`);
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find first .sm or .ssc file
    const smFile = entries.find(entry =>
      !entry.isDirectory &&
      (entry.entryName.endsWith('.sm') || entry.entryName.endsWith('.ssc')) &&
      !entry.entryName.includes('__MACOSX')
    );

    if (!smFile) {
      console.log(`    ⚠️  No .sm/.ssc file found`);
      return null;
    }

    const content = zip.readAsText(smFile);
    const metadata = parseSmFile(content);

    const stats = await stat(zipPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);

    console.log(`    ✓ Title: ${metadata.title || 'Unknown'}`);
    console.log(`    ✓ Artist: ${metadata.artist || 'Unknown'}`);
    console.log(`    ✓ Charts: ${metadata.chartCount}`);
    console.log(`    ✓ Size: ${sizeInMB}MB`);

    return {
      ...metadata,
      size: `~${sizeInMB}MB`,
      fileName: path.basename(zipPath)
    };
  } catch (err) {
    console.error(`    ✗ Error reading ${path.basename(zipPath)}:`, err.message);
    return null;
  }
}

/**
 * Generate ID from filename
 */
function generateId(fileName) {
  return fileName
    .replace(/\.zip$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Main function
 */
async function generateManifest() {
  console.log('🔍 Scanning stepmania-packs folder for ZIP files...\n');

  try {
    // Read all files in directory
    const files = await readdir(PACKS_DIR);
    const zipFiles = files.filter(f => f.endsWith('.zip'));

    if (zipFiles.length === 0) {
      console.log('⚠️  No ZIP files found in stepmania-packs folder');
      console.log('   Add some StepMania packs and run this script again\n');
      return;
    }

    console.log(`Found ${zipFiles.length} ZIP file(s)\n`);

    // Extract metadata from each pack
    const packs = [];
    for (const zipFile of zipFiles) {
      const zipPath = path.join(PACKS_DIR, zipFile);
      const metadata = await extractPackMetadata(zipPath);

      if (metadata) {
        const id = generateId(zipFile);
        packs.push({
          id,
          title: metadata.title || zipFile.replace('.zip', ''),
          artist: metadata.artist || 'Various Artists',
          path: zipFile,
          description: metadata.subtitle || `StepMania pack with ${metadata.chartCount} charts`,
          chartCount: metadata.chartCount,
          size: metadata.size,
          bpm: metadata.bpm,
          enabled: true
        });
      }
      console.log('');
    }

    // Create manifest
    const manifest = {
      version: '1.0',
      generated: new Date().toISOString(),
      packs: packs.sort((a, b) => a.title.localeCompare(b.title))
    };

    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    console.log('✅ Generated manifest.json successfully!');
    console.log(`   ${packs.length} pack(s) added\n`);

    // Print summary
    console.log('📦 Packs in manifest:');
    packs.forEach(pack => {
      console.log(`   • ${pack.title} - ${pack.artist} (${pack.chartCount} charts, ${pack.size})`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Error generating manifest:', err.message);
    process.exit(1);
  }
}

// Check if adm-zip is installed
try {
  require.resolve('adm-zip');
  generateManifest();
} catch (err) {
  console.error('❌ Missing dependency: adm-zip');
  console.log('\nPlease install it first:');
  console.log('  npm install adm-zip\n');
  process.exit(1);
}
