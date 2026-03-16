const { param, validationResult } = require("express-validator");
const { prisma } = require("../lib/prisma");

const checkFile = [
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
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(404).send(errors.array()[0].msg);
    }

    const file = await prisma.file.findUnique({
      where: { id: +req.params.id },
    });
    if (+file.ownerId !== +req.user.id) {
      return res.status(403).send("Unauthorized action!");
    }

    next();
  },
];

module.exports = checkFile;
