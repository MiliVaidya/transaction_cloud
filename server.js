const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON (simulate form submission)
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/process", (req, res) => {
  const { accountNumber, amount } = req.body;
  console.log(`Transaction for Account ${accountNumber}: $${amount}`);
  res.json({ status: "success", message: "Transaction processed!" });
});

app.listen(port, () => {
  console.log(`Transaction app running on port ${port}`);
});
