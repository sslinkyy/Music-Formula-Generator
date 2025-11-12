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
    console.log(`  Scanning ZIP: ${path.basename(zipPath)}`);
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
      fileName: path.basename(zipPath),
      type: 'zip'
    };
  } catch (err) {
    console.error(`    ✗ Error reading ${path.basename(zipPath)}:`, err.message);
    return null;
  }
}

/**
 * Extract metadata from a folder
 */
async function extractFolderMetadata(folderPath) {
  try {
    console.log(`  Scanning folder: ${path.basename(folderPath)}`);
    const files = await readdir(folderPath);

    // Find .sm or .ssc file
    const smFile = files.find(f => f.endsWith('.sm') || f.endsWith('.ssc'));
    if (!smFile) {
      console.log(`    ⚠️  No .sm/.ssc file found`);
      return null;
    }

    const smPath = path.join(folderPath, smFile);
    const content = fs.readFileSync(smPath, 'utf8');
    const metadata = parseSmFile(content);

    // Find audio file
    const audioFile = files.find(f =>
      f.endsWith('.ogg') || f.endsWith('.mp3') || f.endsWith('.wav')
    );

    // Find banner/background
    const bannerFile = files.find(f =>
      f.toLowerCase().includes('banner') && (f.endsWith('.png') || f.endsWith('.jpg'))
    );
    const bgFile = files.find(f =>
      (f.toLowerCase().includes('bg') || f.toLowerCase().includes('background')) &&
      (f.endsWith('.png') || f.endsWith('.jpg'))
    );

    // Calculate folder size
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await stat(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);

    console.log(`    ✓ Title: ${metadata.title || 'Unknown'}`);
    console.log(`    ✓ Artist: ${metadata.artist || 'Unknown'}`);
    console.log(`    ✓ Charts: ${metadata.chartCount}`);
    console.log(`    ✓ Audio: ${audioFile || 'None'}`);
    console.log(`    ✓ Size: ${sizeInMB}MB`);

    // Create file list for fetching
    const fileList = [smFile];
    if (audioFile) fileList.push(audioFile);
    if (bannerFile) fileList.push(bannerFile);
    if (bgFile) fileList.push(bgFile);

    return {
      ...metadata,
      size: `~${sizeInMB}MB`,
      fileName: path.basename(folderPath),
      type: 'folder',
      fileList,
      smFile,
      audioFile: audioFile || null
    };
  } catch (err) {
    console.error(`    ✗ Error reading ${path.basename(folderPath)}:`, err.message);
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
  console.log('🔍 Scanning stepmania-packs folder for packs (ZIPs and folders)...\n');

  try {
    // Read all files in directory
    const files = await readdir(PACKS_DIR);

    // Separate ZIPs and folders
    const zipFiles = [];
    const folders = [];

    for (const file of files) {
      const filePath = path.join(PACKS_DIR, file);
      const stats = await stat(filePath);

      if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        folders.push(file);
      } else if (file.endsWith('.zip')) {
        zipFiles.push(file);
      }
    }

    if (zipFiles.length === 0 && folders.length === 0) {
      console.log('⚠️  No ZIP files or folders found in stepmania-packs folder');
      console.log('   Add some StepMania packs and run this script again\n');
      return;
    }

    console.log(`Found ${zipFiles.length} ZIP file(s) and ${folders.length} folder(s)\n`);

    // Extract metadata from each pack
    const packs = [];

    // Process ZIP files
    for (const zipFile of zipFiles) {
      const zipPath = path.join(PACKS_DIR, zipFile);
      const metadata = await extractPackMetadata(zipPath);

      if (metadata) {
        const id = generateId(zipFile);
        packs.push({
          id,
          type: 'zip',
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

    // Process folders
    for (const folder of folders) {
      const folderPath = path.join(PACKS_DIR, folder);
      const metadata = await extractFolderMetadata(folderPath);

      if (metadata) {
        const id = generateId(folder);
        packs.push({
          id,
          type: 'folder',
          title: metadata.title || folder,
          artist: metadata.artist || 'Various Artists',
          path: folder,
          description: metadata.subtitle || `StepMania pack with ${metadata.chartCount} charts`,
          chartCount: metadata.chartCount,
          size: metadata.size,
          bpm: metadata.bpm,
          fileList: metadata.fileList,
          smFile: metadata.smFile,
          audioFile: metadata.audioFile,
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
