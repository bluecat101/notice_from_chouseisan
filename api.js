const { rejects } = require('assert');
const { spawn } = require('child_process');

const decodeData = ((data)=>{
  const decoder = new TextDecoder();
  return decoder.decode(data);
})
// 投票内容を確認する
const getVoteData = (()=>{
  // Promiseを使わないと処理中状態でreturnすることになるため使用する
  return new Promise(async (resolve) => {
    const pythonProcess = spawn('python', ['main.py', "get_vote_data"]); // 作成
    pythonProcess.stdout.on('data', (data) => {
      resolve(JSON.parse(decodeData(data))); // デコードして結果を返す
    });
    // エラーがあった際に表示する
    pythonProcess.stderr.on('data', (data) => {
      console.error(decodeData(data));
      resolve({})
    });
  })
})

// 登録済みの名前を取得する
const getNameList = (async ()=>{
  // Promiseを使わないと処理中状態でreturnすることになるため使用する
  return new Promise(async (resolve) => {
    const pythonProcess = spawn('python', ['main.py', "get_name_list"]); // 作成
    pythonProcess.stdout.on('data', (data) => {
      data = decodeData(data)
      data = data.replace(/'/g, '"');
      resolve(JSON.parse(data)); // デコードして結果を返す
    });
    // エラーがあった際に表示する
    pythonProcess.stderr.on('data', (data) => {
      console.error(decodeData(data));
      resolve([])
    });
  })
})

const updateData =((url, keyValueJson)=>{
  return new Promise(async (resolve) => {
    const pythonProcess = spawn('python', ['main.py', "update_vote_data", url, JSON.stringify(keyValueJson)]); // 作成
    pythonProcess.on('close', (code) => {
      resolve("")
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(decodeData(data));
    });
  })
})

const deleteData =(async (url)=>{
  return new Promise(async (resolve) => {
    const pythonProcess = spawn('python', ['main.py', "delete_vote_data", url]); // 作成
    // 処理が終わったらresolveする
    pythonProcess.on('close', (code) => {
      resolve("")
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(decodeData(data));
    });
  })
})

const createData = ((url, period, notice, noticeAtNight, name, slackID)=>{
  return new Promise(async (resolve,reject) => {
    let pythonProcess;
    if(slackID === undefined){
      pythonProcess = spawn('python', ['main.py', "create_vote_data", url, period, notice, noticeAtNight, name]); // 作成
    }else{
      pythonProcess = spawn('python', ['main.py', "create_vote_data", url, period, notice, noticeAtNight, name, slackID]); // 作成
    }
    // 処理が終わったらresolveする
    pythonProcess.on('close', (code) => {
      resolve("")
    });
    
    // エラーがあった際に表示する
    pythonProcess.stderr.on('data', (data) => {
      console.error(decodeData(data));
      reject(new Error(decodeData(data)));
    });
  })
})
module.exports = {getNameList, getVoteData, updateData, deleteData, createData};
