const http = require('http');

const data = JSON.stringify({
    server: 'HPWIN11',
    database: 'PVSQLDBN',
    user: 'sa',
    password: 'pass@word123'
});

const options = {
    hostname: 'localhost',
    port: 3030,
    path: '/api/connect',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
