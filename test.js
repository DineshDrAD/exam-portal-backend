const crypto = require("crypto");

let result = "";
let input = 0;

while (result.slice(0, 5) !== "00000") {
  const hash = crypto
    .createHash("sha256")
    .update(String("100xdevs" + input))
    .digest("hex");
  result = hash;
  input++;
  if (input === 10000000) {
    console.log("reached limit");
    break;
  }
}

console.log(result);
console.log("100xdevs" + (input - 1));
