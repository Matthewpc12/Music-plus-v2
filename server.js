/**
 * NODE.JS BACKEND SERVER
 * 
 * Tech Stack: Node.js (Express), yt-dlp, ffmpeg
 * Architecture: 
 * - Polling for downloads
 * - JSON Registry for database
 * - Seeding for initial data
 * 
 * Install: npm install express cors yt-dlp-exec fluent-ffmpeg music-metadata uuid multer
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Dynamic import for music-metadata
let mm;
import('music-metadata').then(m => mm = m).catch(e => console.log('music-metadata not available, using fallbacks'));

const app = express();
const PORT = 3001;

// Configuration
const MUSIC_DIR = path.join(__dirname, 'music');
const REGISTRY_FILE = path.join(MUSIC_DIR, 'video_registry.json');
const CUSTOM_METADATA_FILE = path.join(MUSIC_DIR, 'custom_metadata.json');
const CUSTOM_COVERS_FILE = path.join(MUSIC_DIR, 'custom_covers.json');
const ANIMATED_COVERS_FILE = path.join(MUSIC_DIR, 'animated_covers.json');
const LYRICS_REGISTRY_FILE = path.join(MUSIC_DIR, 'lyrics_registry.json');

// Ensure music directory exists
if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR);
}

// Multer Config for Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, MUSIC_DIR)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
})
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Expose the music directory as static files at /music
app.use('/music', express.static(MUSIC_DIR));

// --- In-Memory State ---
const tasks = {};

// --- Helper Functions ---

const getJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return {}; // Return object for key-value stores
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

const saveJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const getRegistry = () => {
  try {
    if (!fs.existsSync(REGISTRY_FILE)) return [];
    const data = fs.readFileSync(REGISTRY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveRegistry = (data) => {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
};

// Seed the registry if empty
const seedRegistry = () => {
  if (!fs.existsSync(REGISTRY_FILE)) saveRegistry([]);
  if (!fs.existsSync(CUSTOM_METADATA_FILE)) saveJsonFile(CUSTOM_METADATA_FILE, {});
  if (!fs.existsSync(CUSTOM_COVERS_FILE)) saveJsonFile(CUSTOM_COVERS_FILE, {});
  if (!fs.existsSync(ANIMATED_COVERS_FILE)) saveJsonFile(ANIMATED_COVERS_FILE, {});
  if (!fs.existsSync(LYRICS_REGISTRY_FILE)) saveJsonFile(LYRICS_REGISTRY_FILE, {});
};

seedRegistry();

// --- Endpoints ---

// 1. GET /api/status - Health Check
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', server: 'Music Clone Backend' });
});

// 2. GET /api/items - Get Library (Mapped to Songs)
app.get('/api/items', (req, res) => {
  const registry = getRegistry();
  res.json(registry);
});

// 2b. GET /api/all-metadata - Alias for items (used by frontend)
app.get('/api/all-metadata', (req, res) => {
    const registry = getRegistry();
    res.json(registry);
});

// 3. POST /api/items - Start Download (Create Item)
app.post('/api/items', async (req, res) => {
  const { url, title } = req.body;
  const targetUrl = url || title; 

  if (!targetUrl) return res.status(400).json({ error: 'URL or Title is required' });

  const taskId = uuidv4();
  const songId = uuidv4();
  
  tasks[taskId] = {
    id: taskId,
    url: targetUrl,
    status: 'pending',
    progress: 0,
    songId
  };

  res.json({ taskId, message: 'Download started' });
  processDownload(taskId, targetUrl, songId);
});

// 4. GET /api/download-status/:id - Poll Status
app.get('/api/download-status/:id', (req, res) => {
  const task = tasks[req.params.id];
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// 5. GET /api/metadata/:filename - Get Detailed Metadata
app.get('/api/metadata/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(MUSIC_DIR, filename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        if (!mm) {
             return res.status(503).json({ error: 'Metadata parser not ready' });
        }
        
        const metadata = await mm.parseFile(filepath);
        let coverBase64 = null;
        const picture = metadata.common.picture?.[0];
        
        if (picture) {
             coverBase64 = picture.data.toString('base64');
        }

        res.json({
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            duration: metadata.format.duration,
            cover: coverBase64
        });
    } catch (e) {
        console.error("Metadata error:", e);
        res.status(500).json({ error: 'Failed to parse metadata' });
    }
});

// 6. POST /api/custom-metadata - Update metadata overrides
app.post('/api/custom-metadata', (req, res) => {
    const { filename, title, artist, album } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const current = getJsonFile(CUSTOM_METADATA_FILE);
    current[filename] = { 
        title: title || undefined, 
        artist: artist || undefined, 
        album: album || undefined 
    };
    saveJsonFile(CUSTOM_METADATA_FILE, current);
    
    res.json({ status: 'ok', message: 'Metadata updated' });
});

// 7. POST /api/covers/update - Update Cover Mapping
app.post('/api/covers/update', (req, res) => {
    const { key, type, value } = req.body; // type: 'static' | 'animated'
    if (!key || !type) return res.status(400).json({ error: 'Key and Type required' });

    const file = type === 'animated' ? ANIMATED_COVERS_FILE : CUSTOM_COVERS_FILE;
    const current = getJsonFile(file);
    
    if (value) {
        current[key] = value;
    } else {
        delete current[key];
    }
    
    saveJsonFile(file, current);
    res.json({ status: 'ok' });
});

// 8. POST /api/covers/upload - Upload Cover File
app.post('/api/covers/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ filename: req.file.filename });
});

// 9. POST /api/covers/save-url - Download Cover from URL
app.post('/api/covers/save-url', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const fetch = (await import('node-fetch')).default || global.fetch;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const buffer = await response.arrayBuffer();
        const ext = url.includes('.jpg') || url.includes('.jpeg') ? '.jpg' : '.png'; // Simple inference
        const filename = `download-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const filepath = path.join(MUSIC_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(buffer));
        res.json({ filename });
    } catch (e) {
        console.error("Save URL failed:", e);
        res.status(500).json({ error: 'Failed to save image from URL' });
    }
});


// 10. POST /upload - Upload Music File
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;
    const filepath = req.file.path;
    
    let title = req.file.originalname.replace(/\.[^/.]+$/, "");
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let duration = '3:00';
    let durationSec = 180;

    if (mm) {
        try {
            const tags = await mm.parseFile(filepath);
            if (tags.common.title) title = tags.common.title;
            if (tags.common.artist) artist = tags.common.artist;
            if (tags.common.album) album = tags.common.album;
            if (tags.format.duration) {
                durationSec = Math.floor(tags.format.duration);
                const mins = Math.floor(durationSec / 60);
                const secs = Math.floor(durationSec % 60);
                duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
        } catch(e) {
            console.error("Failed to parse uploaded file metadata", e);
        }
    }

    const registry = getRegistry();
    if (!registry.find(s => s.fileName === filename)) {
        registry.push({
            id: uuidv4(),
            title,
            artist,
            album,
            duration,
            durationSec,
            fileName: filename
        });
        saveRegistry(registry);
    }

    res.json({ status: 'ok', message: 'File uploaded successfully', filename });
});

// 11. POST /upload-lyrics - Upload Lyrics File
app.post('/upload-lyrics', upload.single('file'), (req, res) => {
    const filename = req.query.filename;
    if (!filename || !req.file) return res.status(400).json({error: 'Missing filename or file'});
    
    try {
        // Read file content
        const content = fs.readFileSync(req.file.path, 'utf8');
        
        // Update registry
        const registry = getJsonFile(LYRICS_REGISTRY_FILE);
        registry[filename] = content;
        saveJsonFile(LYRICS_REGISTRY_FILE, registry);
        
        // Cleanup upload
        fs.unlinkSync(req.file.path);
        
        res.json({status: 'ok'});
    } catch(e) {
        console.error("Lyrics upload error", e);
        res.status(500).json({error: "Failed"});
    }
});

// --- Background Logic ---

async function processDownload(taskId, url, songId) {
  const task = tasks[taskId];
  const outputFile = path.join(MUSIC_DIR, `${songId}.mp3`);
  const fileName = `${songId}.mp3`;

  try {
    console.log(`[${taskId}] Starting download for ${url}`);
    
    task.status = 'downloading';
    task.progress = 10;

    const ytDlpCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata -o "${outputFile}" "${url}"`;
    
    exec(ytDlpCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`yt-dlp error: ${error.message}`);
        task.status = 'error';
        task.error = 'Download failed';
        return;
      }

      task.status = 'processing';
      task.progress = 90;

      let title = `Song ${songId.substring(0, 4)}`;
      let artist = 'Unknown Artist';
      let album = 'Downloads';
      let duration = '3:00';
      let durationSec = 180;

      if (mm) {
        try {
          if (fs.existsSync(outputFile)) {
              const tags = await mm.parseFile(outputFile);
              if (tags.common.title) title = tags.common.title;
              if (tags.common.artist) artist = tags.common.artist;
              if (tags.common.album) album = tags.common.album;
              if (tags.format.duration) {
                  durationSec = Math.floor(tags.format.duration);
                  const mins = Math.floor(durationSec / 60);
                  const secs = Math.floor(durationSec % 60);
                  duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
              }
          }
        } catch (e) {
            console.error("Metadata read error after download:", e);
        }
      }

      const registry = getRegistry();
      const newSong = {
        id: songId,
        title,
        artist,
        album,
        duration,
        durationSec,
        fileName
      };
      
      registry.push(newSong);
      saveRegistry(registry);
      
      task.progress = 100;
      task.status = 'done';
      task.result = newSong;
    });

  } catch (err) {
    task.status = 'error';
    task.error = err.message;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});