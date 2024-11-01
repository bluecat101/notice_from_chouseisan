const http = require("http");
const fs = require('fs');
const path = require('path');
// const querystring = require('querystring');
const api = require('./api.js');


const server = http.createServer();

server.on("request", async function (req, res) {
  let filePath = "";
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

        // ルートにリダイレクトする
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
        // データ削除
        await api.updateData(url,keyValue);

        // ルートに遷移する
        res.writeHead(303, { 'Location': '/' });
        res.end();
      } catch (error) {
        // エラーハンドリング
        console.error("Error parsing JSON or deleting data:", error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
      }
    });
  }else if (req.method === 'POST' && req.url === '/') {
    let body = '';
    // データを受信
    req.on('data', chunk => {
      body += chunk.toString(); // バイナリデータを文字列に変換
    });

    // データの受信が完了したとき
    req.on('end', async() => {
      try {
        // 受信したボディをJSONにパース
        const parsedBody = JSON.parse(body);
        const url = parsedBody.url;
        const period = parsedBody.period;
        const notice = parsedBody.notice;
        const noticeAtNight = parsedBody.noticeAtNight;
        const name = parsedBody.name;
        const newName = parsedBody.newName;
        const slackId = parsedBody.slackId;

        if(name=="その他"){
          await api.createData(url, period, notice, noticeAtNight, newName, slackId);
        }else{
          await api.createData(url, period, notice, noticeAtNight, name);
        }
        
        // ルートにリダイレクトする
        res.writeHead(303, { 'Location': '/' });
        res.end();
      } catch (error) {
        res.writeHead(409, { 'Location': '/' });
        res.end(error.message);
      }
    })
  } else { // 一致するルーティングが存在しない場合
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

