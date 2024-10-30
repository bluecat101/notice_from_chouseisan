const { spawn } = require('child_process');

const decodeData = ((data)=>{
  const decoder = new TextDecoder();
  return decoder.decode(data);
})
// 投票内容を確認する
const getVoteData = (async ()=>{
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

const updateData =(async (url, keyValueJson)=>{
  const pythonProcess = await spawn('python', ['main.py', "update_vote_data", url, JSON.stringify(keyValueJson)]); // 作成
  pythonProcess.stderr.on('data', (data) => {
    console.error(decodeData(data));
  });
})

const deleteData =(async (url)=>{
  const pythonProcess = await spawn('python', ['main.py', "delete_vote_data", url]); // 作成
  pythonProcess.stderr.on('data', (data) => {
    console.error(decodeData(data));
  });
})

const createData = (async (url, period, notice, noticeAtNight, name, slackID)=>{
  const pythonProcess = await spawn('python', ['main.py', url, period, notice, noticeAtNight, name, slackID]); // 作成
})
module.exports = {getNameList, getVoteData, updateData, deleteData, createData};
