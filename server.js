const http = require("http");
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const querystring = require('querystring');
const api = require('./api.js');


const server = http.createServer();
let filePath;
server.on("request", async function (req, res) {
  filePath = "";
  if (req.method === 'GET' && req.url === '/') {
    filePath = path.join(__dirname, 'front/main.html');
  } else if (req.method === 'GET' && req.url === '/front/main.css') {
    filePath = path.join(__dirname, 'front/main.css');
  } else if (req.method === 'GET' && req.url === '/front/main.js') {
    filePath = path.join(__dirname, 'front/main.js');
  }else if (req.method === 'GET' && req.url === '/api.js') {
    filePath = path.join(__dirname, 'api.js');
  } else if (req.method === 'POST' && req.url === '/front/submit') {
    let body = '';

    // POSTデータを受信する
    req.on('data', chunk => {
      body += chunk.toString(); // バイナリデータを文字列に変換
    });

    // データの受信が完了したとき
    req.on('end', () => {
      // 受け取ったデータをパース
      const params = querystring.parse(body);
      const url = params["url"]
      const period = params["period"]
      const notice = ("notice" in params)? true: false
      const noticeAtNight = ("notice-at-night" in params)? true: false
      const name = params["name"]

      const pythonProcess = spawn('python', ['main.py', url, period, notice, noticeAtNight, name]); // 作成
        let output;
        pythonProcess.stdout.on('data', (data) => {
          output = data
          // console.log(`標準出力: ${data}`); // Python の出力をコンソールに表示
        });
        pythonProcess.on('close', (code) => {
          // どうにかして送る
          res.writeHead(303, { 'Location': '/' });
          res.end(); // レスポンスを終了
        })
    })
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Page not found');
    return;
  }
  if(filePath!=""){
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        extension = filePath.split(".").pop()
        if(extension == "js"){
          res.writeHead(200, { 'Content-Type': `text/javascript` });
        }else{
          res.writeHead(200, { 'Content-Type': `text/${extension}` });
        }
        
        res.end(data);
      }
    });
  }
});

server.listen(8080, "127.0.0.1");
console.log("server is listening on http://127.0.0.1:8080");

