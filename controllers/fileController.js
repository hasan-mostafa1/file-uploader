const { prisma } = require("../lib/prisma");
const { param, validationResult } = require("express-validator");
const auth = require("../middlewares/authMiddleware");
const upload = require("../config/multer");
const path = require("node:path");
const fs = require("node:fs/promises");

const fileExists = [
  param("id")
    .exists()
    .withMessage("file id is required")
    .trim()
    .notEmpty()
    .withMessage("file id can't be empty")
    .custom(async (value) => {
      const existingFile = await prisma.file.findUnique({
        where: { id: +value },
      });
      if (!existingFile) {
        throw new Error("Unvalid file id!");
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(404).send(errors.array()[0].msg);
    }
    next();
  },
];

module.exports.uploadFile = [
  auth,
  upload.single("file"),
  async (req, res) => {
    await prisma.file.create({
      data: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        ownerId: req.user.id,
      },
    });

    res.redirect("/");
  },
];

module.exports.show = [
  auth,
  fileExists,
  async (req, res) => {
    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });
    res.render("file/show", { file: file });
  },
];

module.exports.downloadFile = [
  auth,
  fileExists,
  async (req, res, next) => {
    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });
    const filePath = path.join(__dirname, "../storage/uploads", file.fileName);

    try {
      await fs.access(filePath, fs.constants.R_OK);
      res.download(filePath, file.originalName, (err) => {
        if (err) {
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  },
];

module.exports.destroy = [
  auth,
  fileExists,
  async (req, res) => {
    await prisma.file.delete({
      where: { id: +req.params.id },
    });
    res.redirect("/");
  },
];
