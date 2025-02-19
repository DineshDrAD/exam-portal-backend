const express = require("express");
const router = express.Router();
const {
  createSubject,
  getSubjects,
  deleteSubject,
  editSubjects,
} = require("../controllers/subjectController");

router.get("/get", getSubjects);
router.post("/create", createSubject);
router.put("/update/:id", editSubjects);
router.delete("/delete/:id", deleteSubject);

module.exports = router;
