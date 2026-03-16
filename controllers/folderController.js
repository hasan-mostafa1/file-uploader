const {
  body,
  check,
  matchedData,
  validationResult,
} = require("express-validator");
const auth = require("../middlewares/authMiddleware");
const checkFolder = require("../middlewares/checkFolderMiddleware");
const { prisma } = require("../lib/prisma");
const upload = require("../config/multer");
const supabase = require("../lib/supabase");
const { decode } = require("base64-arraybuffer");

const validateFolder = [
  body("name")
    .exists()
    .withMessage("name is required")
    .trim()
    .notEmpty()
    .withMessage("name can't be empty")
    .isString()
    .withMessage("name must be a string"),
];

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

module.exports.store = [
  auth,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .render("home", { user: req.user, errors: errors.array() });
    }
    const { name } = matchedData(req);
    await prisma.folder.create({
      data: {
        name: name,
        owner: {
          connect: { id: req.user.id },
        },
      },
    });

    res.redirect("/");
  },
];

module.exports.storeChildFolders = [
  auth,
  checkFolder,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const folder = await prisma.folder.findUnique({
        where: { id: +req.params.id },
        include: {
          folders: true,
          files: true,
        },
      });
      res
        .status(400)
        .render("folder/show", { errors: errors.array(), folder: folder });
    }
    const { name } = matchedData(req);
    const parentId = +req.params.id;

    await prisma.folder.create({
      data: {
        name: name,
        owner: {
          connect: { id: req.user.id },
        },
        parent: {
          connect: { id: parentId },
        },
      },
    });

    res.redirect(`/folders/${parentId}`);
  },
];

module.exports.show = [
  auth,
  checkFolder,
  async (req, res) => {
    const folder = await prisma.folder.findUnique({
      where: { id: +req.params.id },
      include: {
        folders: true,
        files: true,
      },
    });
    res.render("folder/show", { folder: folder });
  },
];

module.exports.edit = [
  auth,
  checkFolder,
  async (req, res) => {
    const folder = await prisma.folder.findUnique({
      where: { id: +req.params.id },
    });
    res.render("folder/edit", { folder: folder });
  },
];

module.exports.update = [
  auth,
  checkFolder,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("folder/edit", { errors: errors.array() });
    }
    const { name } = matchedData(req);
    const UpdatedFolder = await prisma.folder.update({
      data: {
        name: name,
      },
      where: { id: +req.params.id },
    });

    res.redirect(`/folders/${UpdatedFolder.id}`);
  },
];

module.exports.uploadFile = [
  auth,
  checkFolder,
  upload.single("file"),
  validateFile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
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
        folderId: +req.params.id,
        ownerId: req.user.id,
      },
    });

    res.redirect(`/folders/${req.params.id}`);
  },
];

module.exports.destroy = [
  auth,
  checkFolder,
  async (req, res) => {
    await prisma.folder.delete({
      where: { id: +req.params.id },
    });

    res.redirect("/");
  },
];
