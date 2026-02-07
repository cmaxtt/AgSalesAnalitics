
const http = require('http');

const data = JSON.stringify({
    startDate: "2025-01-01",
    endDate: "2025-02-01"
});

const options = {
    hostname: 'localhost',
    port: 3030,
    path: '/api/reports/cashier-flash',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log(`StatusCode: ${res.statusCode}`);

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            console.log("Response JSON (first item):", json.data && json.data.length > 0 ? json.data[0] : "No data");
        } catch (e) {
            console.log("Body:", body);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
