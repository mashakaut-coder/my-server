const http = require("http");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");

// Tells the browser what kind of file it's getting
const contentTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
};

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

    if (url.pathname === "/contact") {
        const filePath = path.join(__dirname, "public", "contact.html");

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

    if (url.pathname === "/api/contact") {
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json", "Allow": "POST" });
            res.end(JSON.stringify({ error: "Use POST to send a message" }));
            return;
        }

        let body = "";
        let tooLarge = false;

        req.on("data", (chunk) => {
            body += chunk;
            // Stop reading if someone sends way more than a contact message needs
            if (body.length > 10000) {
                tooLarge = true;
                req.destroy();
            }
        });

        req.on("end", () => {
            if (tooLarge) return;

            let data;
            try {
                data = JSON.parse(body);
                if (!data || typeof data !== "object") throw new Error("Not an object");
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid request" }));
                return;
            }

            const name = typeof data.name === "string" ? data.name.trim() : "";
            const email = typeof data.email === "string" ? data.email.trim() : "";
            const message = typeof data.message === "string" ? data.message.trim() : "";

            // Check again on the server, since anyone can skip the page's checks
            const errors = {};
            if (!name) errors.name = "Please enter your name.";
            else if (name.length > 100) errors.name = "Name is too long.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email.";
            else if (email.length > 200) errors.email = "Email is too long.";
            if (!message) errors.message = "Please enter a message.";
            else if (message.length > 5000) errors.message = "Message is too long.";

            if (Object.keys(errors).length > 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Please fix the errors above.", errors }));
                return;
            }

            // Save each message as one line of JSON in messages.jsonl
            const entry = { name, email, message, receivedAt: new Date().toISOString() };
            const messagesFile = path.join(__dirname, "messages.jsonl");

            fs.appendFile(messagesFile, JSON.stringify(entry) + "\n", (err) => {
                if (err) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Couldn't save your message. Please try again." }));
                    return;
                }

                console.log("New contact message from " + name + " <" + email + ">");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true }));
            });
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

    // Any other address: try to serve a matching file from public/
    const contentType = contentTypes[path.extname(url.pathname).toLowerCase()];

    if (req.method === "GET" && contentType) {
        let filePath;
        try {
            filePath = path.join(publicDir, decodeURIComponent(url.pathname));
        } catch (err) {
            filePath = null;
        }

        // Only serve files inside public/, never things like /../server.js
        if (filePath && filePath.startsWith(publicDir + path.sep)) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not found");
                    return;
                }

                res.writeHead(200, { "Content-Type": contentType });
                res.end(data);
            });

            return;
        }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});



