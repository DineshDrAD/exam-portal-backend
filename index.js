const express = require("express");
const cookieParser = require("cookie-parser");
const { connectWithRetry } = require("./config/db");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT || 4000;

connectWithRetry();

app.use(cookieParser());
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
app.use("/api/exam-submission", require("./routes/examSubmissionRoute"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/review", require("./routes/reviewRoute"));
app.use("/api/duration", require("./routes/durationRoute"));
app.use("/api/mark", require("./routes/markRoute"));
app.use("/api/dashboard", require("./routes/dashboardRoute"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
