const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs-extra");

const BASE_URL = process.argv[2] || "http://localhost:3000";

const locations = [
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Delhi", lat: 28.6139, lon: 77.2090 },
    { name: "Rural UP", lat: 25.2831, lon: 81.9167 },
    { name: "Bangalore", lat: 12.9716, lon: 77.5946 }
];

const endpoints = [
    { id: "jurisdiction", path: "/api/jurisdiction", keys: ["jurisdiction", "insights"] },
    { id: "electoral", path: "/api/electoral", keys: ["representatives"] },
    { id: "wards", path: "/api/wards", keys: ["metro_data"] },
    { id: "infrastructure", path: "/api/infrastructure", keys: ["infrastructure"] },
    { id: "health", path: "/api/health", keys: ["status"] }
];

async function testEndpoint(location, endpoint) {

    const start = Date.now();

    try {

        const res = await axios.get(`${BASE_URL}${endpoint.path}`, {
            params: {
                lat: location.lat,
                lon: location.lon
            },
            timeout: 45000
        });

        const latency = Date.now() - start;

        const missing = endpoint.keys.filter(
            k => res.data[k] === undefined
        );

        const size = Buffer.byteLength(
            JSON.stringify(res.data)
        );

        const status =
            missing.length === 0 ? "PASS" : "MISSING";

        console.log(
            chalk.cyan(`\n📍 ${location.name} → ${endpoint.id}`)
        );

        console.log(
            chalk.gray(`Status:`),
            res.status
        );

        console.log(
            chalk.gray(`Latency:`),
            latency + " ms"
        );

        console.log(
            chalk.gray(`Response Size:`),
            size + " bytes"
        );

        if (status === "PASS") {
            console.log(chalk.green("✔ PASS"));
        } else {
            console.log(
                chalk.yellow(
                    `⚠ Missing keys: ${missing.join(", ")}`
                )
            );
        }

        return {
            location: location.name,
            endpoint: endpoint.id,
            status,
            latency,
            size,
            missing,
            response: res.data
        };

    } catch (err) {

        console.log(
            chalk.red(
                `❌ ${location.name} → ${endpoint.id}`
            )
        );

        return {
            location: location.name,
            endpoint: endpoint.id,
            status: "FAIL",
            error: err.message
        };
    }
}

async function runSuite() {

    console.log(
        chalk.blue(
            `\n🚀 Advanced API Test Suite`
        )
    );

    console.log(
        chalk.gray(`Target:`),
        BASE_URL
    );

    const tasks = [];

    for (const loc of locations) {
        for (const ep of endpoints) {
            tasks.push(testEndpoint(loc, ep));
        }
    }

    const results = await Promise.all(tasks);

    const passed =
        results.filter(r => r.status === "PASS").length;

    console.log(
        chalk.green(
            `\n✔ Passed: ${passed}/${results.length}`
        )
    );

    await fs.writeJson(
        "suite_report.json",
        {
            timestamp: new Date().toISOString(),
            base_url: BASE_URL,
            total_tests: results.length,
            passed,
            results
        },
        { spaces: 2 }
    );

    generateHTML(results);

    console.log(
        chalk.magenta(
            "\n📄 Reports generated:"
        )
    );

    console.log("suite_report.json");
    console.log("suite_report.html");
}

function generateHTML(results) {

    const rows = results
        .map(r => `
<tr>
<td>${r.location}</td>
<td>${r.endpoint}</td>
<td>${r.status}</td>
<td>${r.latency || "-"}</td>
<td>${r.size || "-"}</td>
</tr>
`)
        .join("");

    const html = `
<html>
<head>
<title>API Test Report</title>
<style>
body{font-family:Arial;padding:30px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccc;padding:10px;text-align:left}
th{background:#eee}
</style>
</head>
<body>
<h1>API Test Report</h1>
<table>
<tr>
<th>Location</th>
<th>Endpoint</th>
<th>Status</th>
<th>Latency(ms)</th>
<th>Response Size</th>
</tr>
${rows}
</table>
</body>
</html>
`;

    fs.writeFileSync(
        "suite_report.html",
        html
    );
}

runSuite();