const http = require("http");
const https = require("https");

const PORT = process.env.PORT || 3000;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, corsHeaders());
    res.end(JSON.stringify({ status: "CaptiveRadar Proxy Online", version: "2.0" }));
    return;
  }

  if (req.method === "POST" && req.url === "/apollo/search") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        const { apiKey, ...searchParams } = parsed;

        if (!apiKey) {
          res.writeHead(400, corsHeaders());
          res.end(JSON.stringify({ error: "Missing apiKey" }));
          return;
        }

        const postData = JSON.stringify({ api_key: apiKey, ...searchParams });

        const options = {
          hostname: "api.apollo.io",
          port: 443,
          path: "/v1/mixed_people/search",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            "Cache-Control": "no-cache",
            "X-Api-Key": apiKey,
          },
        };

        const apolloReq = https.request(options, apolloRes => {
          let data = "";
          apolloRes.on("data", chunk => data += chunk);
          apolloRes.on("end", () => {
            res.writeHead(apolloRes.statusCode, corsHeaders());
            res.end(data);
          });
        });

        apolloReq.on("error", err => {
          res.writeHead(500, corsHeaders());
          res.end(JSON.stringify({ error: err.message }));
        });

        apolloReq.write(postData);
        apolloReq.end();
      } catch (err) {
        res.writeHead(500, corsHeaders());
        res.end(JSON.stringify({ error: "Parse error: " + err.message }));
      }
    });
    return;
  }

  res.writeHead(404, corsHeaders());
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`CaptiveRadar proxy v2 running on port ${PORT}`);
});
