module.exports.index = (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home", { user: req.user });
  } else {
    res.redirect("/login");
  }
};
