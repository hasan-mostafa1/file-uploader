const {
  body,
  param,
  matchedData,
  validationResult,
} = require("express-validator");
const auth = require("../middlewares/authMiddleware");
const { prisma } = require("../lib/prisma");

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

const folderExists = [
  param("id")
    .exists()
    .withMessage("folder id is required")
    .trim()
    .notEmpty()
    .withMessage("folder id can't be empty")
    .custom(async (value) => {
      const existingFolder = await prisma.folder.findUnique({
        where: { id: +value },
      });
      if (!existingFolder) {
        throw new Error("Unvalid folder id!");
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

module.exports.store = [
  auth,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).render("home", { errors: errors.array() });
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
  folderExists,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const folder = await prisma.folder.findUnique({
        where: { id: +req.params.id },
        include: {
          folders: true,
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
  folderExists,
  async (req, res) => {
    const folder = await prisma.folder.findUnique({
      where: { id: +req.params.id },
      include: {
        folders: true,
      },
    });

    res.render("folder/show", { folder: folder });
  },
];

module.exports.edit = [
  auth,
  folderExists,
  async (req, res) => {
    const folder = await prisma.folder.findUnique({
      where: { id: +req.params.id },
    });
    res.render("folder/edit", { folder: folder });
  },
];

module.exports.update = [
  auth,
  folderExists,
  validateFolder,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("folder/edit", { errors: errors.array() });
    }
    const { name } = matchedData(req);
    const folder = await prisma.folder.update({
      data: {
        name: name,
      },
      where: { id: +req.params.id },
    });

    res.redirect(`/folders/${folder.id}`);
  },
];

module.exports.destroy = [
  auth,
  folderExists,
  async (req, res) => {
    await prisma.folder.delete({
      where: { id: +req.params.id },
    });

    res.redirect("/");
  },
];
