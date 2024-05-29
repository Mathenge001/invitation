const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime');

const app = express();
const port = 3000;

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 50000000 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('media');

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|mp4|avi|mov/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images and Videos Only!');
  }
}

// Public folder
app.use(express.static('./public'));
app.use('/uploads', express.static('uploads'));

// Serve photos.html as the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'photos.html'));
});

// Upload endpoint
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.json({ success: false, message: err });
    } else {
      if (req.file == undefined) {
        res.json({ success: false, message: 'No file selected' });
      } else {
        res.json({
          success: true,
          file: {
            filename: req.file.filename,
            type: req.file.mimetype
          }
        });
      }
    }
  });
});

// Fetch media files
app.get('/media', (req, res) => {
  fs.readdir('./uploads', (err, files) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Unable to fetch files' });
    } else {
      const mediaFiles = files.map(file => ({
        filename: file,
        type: mime.getType(file)
      }));
      res.json(mediaFiles);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
