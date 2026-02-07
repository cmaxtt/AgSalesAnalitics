const http = require('http');

const data = JSON.stringify({
    startDate: "2025-01-01",
    endDate: "2025-02-01"
});

const options = {
    hostname: 'localhost',
    port: 3030,
    path: '/api/connection-status',
    method: 'POST', // Changed method to POST to send data
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log(`StatusCode: ${res.statusCode}`);

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log("Body:", body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();
