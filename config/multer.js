const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs/promises");

async function ensureFolder(folderPath) {
  try {
    await fs.mkdir(folderPath, { recursive: true });
  } catch (e) {}
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const storagePath = path.join(__dirname, "../storage/uploads");
    await ensureFolder(storagePath);
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
