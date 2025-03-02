const express = require("express");
const { connectWithRetry } = require("./config/db");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT || 4000;

connectWithRetry();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use("/api/users", require("./routes/userRoute"));
app.use("/api/subjects", require("./routes/subjectRoute"));
app.use("/api/exams", require("./routes/examRoute"));
app.use("/api/exam-function", require("./routes/examFunctionRoute"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
