// Basic API test script
const http = require("http");

const testEndpoint = (path, method = "GET") => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });

    req.on("error", reject);
    req.end();
  });
};

async function runTests() {
  console.log("Running API tests...");

  try {
    const health = await testEndpoint("/health");
    console.log("Health check:", health.status === 200 ? "PASS" : "FAIL");
  } catch (error) {
    console.log("Tests failed:", error.message);
  }
}

runTests();
