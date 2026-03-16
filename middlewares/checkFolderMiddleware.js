const { param, validationResult } = require("express-validator");
const { prisma } = require("../lib/prisma");

const checkFolder = [
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
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(404).send(errors.array()[0].msg);
    }

    const folder = await prisma.folder.findUnique({
      where: { id: +req.params.id },
    });
    if (folder.ownerId !== req.user.id) {
      return res.status(403).send("Unauthorized action!");
    }

    next();
  },
];

module.exports = checkFolder;
