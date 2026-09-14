const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://" + req.headers.host);

    if (url.pathname === "/") {
        const filePath = path.join(__dirname, "public", "index.html");

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error");
                return;
            }

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });

        return;
    }

    if (url.pathname === "/about") {
        const filePath = path.join(__dirname, "public", "about.html");

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error");
                return;
            }

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });

        return;
    }

    if (url.pathname === "/api/time") {
        const currentTime = new Date();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ time: currentTime }));

        return;
    }

    if (url.pathname === "/api/greeting") {
        const name = url.searchParams.get("name");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Hello, " + name + "!" }));

        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});



