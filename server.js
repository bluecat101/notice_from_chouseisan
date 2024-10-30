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
  }else if (req.method === 'GET' && req.url === '/vote_data') {
    data = await api.getVoteData()
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }else if (req.method === 'GET' && req.url === '/name_list') {
    data = await api.getNameList()
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }else if (req.method === 'DELETE' && req.url === '/') {
    let body = '';
    
    // データを受信
    req.on('data', chunk => {
      body += chunk.toString(); // バイナリデータを文字列に変換
    });

    req.on('end', async () => {
      try {
        // 受信したボディをJSONにパース
        const parsedBody = JSON.parse(body);
        const url = parsedBody.url;
        // APIのデータ削除関数を呼び出し
        await api.deleteData(url);

        // 成功レスポンス
        res.writeHead(303, { 'Location': '/' });
        res.end();
      } catch (error) {
        // エラーハンドリング
        console.error("Error parsing JSON or deleting data:", error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
    });
  }else if (req.method === 'PATCH' && req.url === '/') {
  let body = '';
  
  // データを受信
  req.on('data', chunk => {
    body += chunk.toString(); // バイナリデータを文字列に変換
  });

  req.on('end', async () => {
    try {
      // 受信したボディをJSONにパース
      const parsedBody = JSON.parse(body);
      const url = parsedBody.url;
      const keyValue = parsedBody.keyValue;
      // APIのデータ削除関数を呼び出し
      await api.updateData(url,keyValue);

      // 成功レスポンス
      res.writeHead(303, { 'Location': '/' });
      res.end();
    } catch (error) {
      // エラーハンドリング
      console.error("Error parsing JSON or deleting data:", error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  });
  }else if (req.method === 'POST' && req.url === '/front/submit') {
    let body = '';

    // POSTデータを受信する
    req.on('data', chunk => {
      body += chunk.toString(); // バイナリデータを文字列に変換
    });

    // データの受信が完了したとき
    req.on('end', async() => {
      try {
        // 受け取ったデータをパース
        const params = querystring.parse(body);
        const url = params["url"]
        const period = params["period"]
        const notice = ("notice" in params)? true: false
        const noticeAtNight = ("notice-at-night" in params)? true: false
        const name = params["name"]
        await api.createData(url, period, notice, noticeAtNight, name);
  
        // 成功レスポンス
        res.writeHead(303, { 'Location': '/' });
        res.end();
      } catch (error) {
        // エラーハンドリング
        console.error("Error parsing JSON or deleting data:", error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
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

