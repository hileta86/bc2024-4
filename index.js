const http = require('http');
const fs = require('fs').promises;
const { Command } = require('commander');
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <host>')
  .requiredOption('-p, --port <port>')
  .requiredOption('-c, --cache <path>');

program.parse();

const options = program.opts();

if (!options.host || !options.port || !options.cache) {
  console.error("Error: Required parameters --host, --port, and --cache are missing.");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('/');
  const httpCode = urlParts[1];

  if (!httpCode || isNaN(httpCode)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end("wrong urlka /<http_code>.");
    return;
  }

  const filePath = path.join(options.cache, `${httpCode}.jpg`);

  try {
    if (req.method === 'GET') {
      const image = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(image);
    } else if (req.method === 'PUT') {
      let data = [];
      req.on('data', chunk => data.push(chunk));
      req.on('end', async () => {
        try {
          await fs.writeFile(filePath, Buffer.concat(data));
          res.writeHead(201, { 'Content-Type': 'text/plain' });
          res.end("img cached successfuly.");
        } catch (error) {
          console.error("error wrt file:", error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end("Internal Server Error");
        }
      });
    } else if (req.method === 'DELETE') {
      try {
        await fs.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("img deleted successfully.");
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end("not found.");
        } else {
          console.error("Error deleting file:", error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end("Internal Server Error");
        }
      }
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end("sho");
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end("img not found");
    } else {
      console.error("Error handling request:", error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end("Internal Server Error");
    }
  }
});


server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
