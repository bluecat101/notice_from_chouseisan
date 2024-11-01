// const { table } = require("console");

let voteData;
let nameList;
const fetchVoteData = (async()=>{
  try {
      // fetchが完了するまで待機
      const response = await fetch("http://127.0.0.1:8080/vote_data");
      // レスポンスのJSON変換が完了するまで待機
      const data = await response.json();
      return data; // 必要に応じてデータを返す
  } catch (error) {
      console.error("Error fetching data:", error);
  }
}) 
const fetchNameList = (async()=>{
  try {
      // fetchが完了するまで待機
      const response = await fetch("http://127.0.0.1:8080/name_list");
      // レスポンスのJSON変換が完了するまで待機
      const data = await response.json();
      return data; // 必要に応じてデータを返す
  } catch (error) {
      console.error("Error fetching data:", error);
  }
}) 
// 削除する関数
const deleteVoteData = (async(url)=>{
  try {
    const response = await fetch("http://127.0.0.1:8080/", {
      method: "DELETE",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url }),
    });

    if (response.ok) {
      window.location.href = '/'; 
    } else {
      console.error("Failed to delete item");
    }
  } catch (error) {
    console.error("Error:", error);
  }
})

// 更新する関数
const updateVoteData = (async(url, updatedKeyValue)=>{
  try {
    const response = await fetch("http://127.0.0.1:8080/", {
      method: "PATCH",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({url: url, keyValue: updatedKeyValue}),
    });

    if (response.ok) {
      window.location.href = '/'; 
    } else {
      console.error("Failed to delete item");
    }
  } catch (error) {
    console.error("Error:", error);
  }
})

// 作成する関数
const createVoteData = (async()=>{
  const form = document.getElementById("from");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());  // フォームのデータをJSON形式に変換
  const url = data["url"];
  const period = data["period"];
  const notice = ("notice" in data)? true: false;
  const noticeAtNight = ("notice-at-night" in data)? true: false;
  const name = data["name"];
  const newName = data["newName"];
  const slackId = data["slackId"];
  try {
    const response = await fetch("http://127.0.0.1:8080/", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({url: url,period: period, notice: notice, noticeAtNight: noticeAtNight, name: name, newName: newName, slackId: slackId}),
    });

    if (response.ok) {
      window.location.href = '/'; 
    }else{
      const errorText = await response.text();
      throw new Error(errorText);
    }
  } catch (error) {
    alert(error);
  }
})




// 一覧部分の作成
const createIndex =(()=>{
  let table_index = document.getElementById("index")
  let text = "";
  let i=0;
  if(!voteData){
    return false;
  }
  Object.keys(voteData).sort().forEach((url)=>{
    const data = voteData[url]
    const urlId = url.replace("https://chouseisan.com/s?h=","")
    text += `
    <tr>
      <td><a href="${url}">${urlId}</a></td>
      <td>${data["period"]}</td>
      <td><div class="toggle_button"><input id="notice_${i}" class="toggle_input" type='checkbox' ${data["is_send_notification"]?"checked":""} /><label for="toggle" class="toggle_label"></div></td>
      <td><div class="toggle_button"><input id="notice_at_night_${i}" class="toggle_input" type='checkbox' ${data["is_send_notification_at_night"]?"checked":""} /><label for="toggle" class="toggle_label"></div></td>
      <td>${data["to"]}</td>
      <td></td>
      <td><button id= "delete_${i}">削除</button></td>
    </tr>
    `
    i++;
  })
  table_index.getElementsByTagName("tbody")[0].innerHTML = text
  i=0;
  Object.keys(voteData).forEach((url)=>{
    const notice_i = document.getElementById(`notice_${i}`);
    const notice_at_night_i = document.getElementById(`notice_at_night_${i}`);
    notice_i.addEventListener("click",()=>{updateVoteData(url, {"is_send_notification": notice_i.checked})})
    notice_at_night_i.addEventListener("click",()=>{updateVoteData(url, {"is_send_notification_at_night": notice_at_night_i.checked})})
    document.getElementById(`delete_${i}`).addEventListener("click",()=>{deleteVoteData(url)})
    i++;
  })
  
})

const setNameListAsOption =(()=>{
  const select = document.getElementById("select_name")
  let options = ""; 
  // 名前とその他の選択肢の追加
  nameList.forEach((name)=>{
    options += `<option value=${name}>${name}</option>`
  })
  select.innerHTML += `
    ${options}
    <option value="その他">その他</option>
  `
  const select_name = document.getElementById("select_name")
  const thNewName = document.getElementById("th-newName")
  const thSlackId = document.getElementById("th-slackId")
  const tdNewName = document.getElementById("td-newName")
  const tdSlackId = document.getElementById("td-slackId")
  select_name.addEventListener("change", ()=>{
    if (select_name.value === "その他") {
      // テーブルの要素として表示する
      thNewName.style.display = "table-cell";
      thSlackId.style.display = "table-cell";
      tdNewName.style.display = "table-cell";
      tdSlackId.style.display = "table-cell";
      // 入力を必須とする
      tdNewName.setAttribute('required', '');
      tdSlackId.setAttribute('required', '');
    } else {
      // 非表示にする
      thNewName.style.display = "none";
      thSlackId.style.display = "none";
      tdNewName.style.display = "none";
      tdSlackId.style.display = "none";
      // 入力必須のままだとエラーになるので入力必須を解除する
      tdNewName.removeAttribute('required');
      tdSlackId.removeAttribute('required');
    }
  });


})

const main =(async ()=>{
  voteData = await fetchVoteData();
  nameList = await fetchNameList();
  createIndex();
  setNameListAsOption();
  document.getElementById("submit").addEventListener("click",()=>{createVoteData()})
})

main();
