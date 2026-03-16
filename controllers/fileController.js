const { prisma } = require("../lib/prisma");
const auth = require("../middlewares/authMiddleware");
const checkFile = require("../middlewares/checkFileMiddleware");
const upload = require("../config/multer");
const supabase = require("../lib/supabase");
const { decode } = require("base64-arraybuffer");
const { check, validationResult } = require("express-validator");

const validateFile = [
  check("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("File is required");
    }
    // Validate MIME type
    if (req.file.mimetype !== "application/pdf") {
      throw new Error("Only PDF documents are allowed");
    }
    // Validate file size (e.g., max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (req.file.size > maxSize) {
      throw new Error("File is too large (max 2MB)");
    }
    return true;
  }),
];

module.exports.uploadFile = [
  auth,
  upload.single("file"),
  validateFile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .render("home", { user: req.user, fileErrors: errors.array() });
    }

    const fileBase64 = decode(req.file.buffer.toString("base64"));
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(req.file.originalname, fileBase64, {
        contentType: req.file.mimetype,
      });
    if (error) {
      throw error;
    }

    await prisma.file.create({
      data: {
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        path: data.path,
        ownerId: req.user.id,
      },
    });

    res.redirect("/");
  },
];

module.exports.show = [
  auth,
  checkFile,
  async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });

    res.render("file/show", { file: file });
  },
];

module.exports.downloadFile = [
  auth,
  checkFile,
  async (req, res, next) => {
    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });

    const { data, error } = await supabase.storage
      .from("uploads")
      .download(file.path);

    if (error) {
      throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res
      .set({
        "content-type": data.type,
        "Content-Disposition": `attachment; filename="${file.originalName}"`,
      })
      .send(buffer);
  },
];

module.exports.destroy = [
  auth,
  checkFile,
  async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });

    const { data, error } = await supabase.storage
      .from("uploads")
      .remove([file.path]);
    if (error) {
      throw error;
    }

    await prisma.file.delete({
      where: { id: +req.params.id },
    });
    res.redirect("/");
  },
];
