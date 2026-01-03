const express = require("express");
const cookieParser = require("cookie-parser");
const { connectWithRetry } = require("./config/db");
const app = express();
require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT || 4000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [process.env.CLIENT_URL];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

if (require.main === module) {
  connectWithRetry();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
