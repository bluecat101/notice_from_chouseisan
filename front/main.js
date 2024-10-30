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

// idを削除する関数
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
      // window.location.href = '/'; 
    } else {
      console.error("Failed to delete item");
    }
  } catch (error) {
    console.error("Error:", error);
  }
})



const createIndex =(()=>{
  let table_index = document.getElementById("index")
  let text = "";
  let i=0;
  if(!voteData){
    return false;
  }
  Object.keys(voteData).forEach((url)=>{
    const data = voteData[url]
    text += `
    <tr>
      <td>${url}</td>
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
    notice_i.addEventListener("click",()=>{updateVoteData(url, {"is_send_notification": notice_i.classList.toggle("active")})})
    notice_at_night_i.addEventListener("click",()=>{updateVoteData(url, {"is_send_notification_at_night": notice_at_night_i.classList.toggle("active")})})
    document.getElementById(`delete_${i}`).addEventListener("click",()=>{deleteVoteData(url)})
    i++;
  })
  
})

const setNameListAsOption =(()=>{
  const name_container = document.getElementById("name_container")
  let options = ""; 
  nameList.forEach((name)=>{
    options += `<option value=${name}>${name}</option>`
  })
  name_container.innerHTML += `<select name="name" id="select_name">
  ${options}
    <option value="other">その他</option>
  </select>
  <input type="text" id="other-input" placeholder="Enter your choice" style="display:none; margin-top:10px;">
  `
  // name_container.insertAdjacentHTML("afterend", otherInput);
  const showInput=(() => {
    select_name.style.display = "none"; // selectを隠す
    otherInput.style.display = "inline"; // inputを表示
    otherInput.focus(); // 入力フィールドにフォーカス
  })


  const select_name = document.getElementById("select_name")
  const otherInput = document.getElementById("other-input")
  select_name.addEventListener("change", ()=>{
    if (select_name.value === "other") {
      // otherInput.style.display = "block"; // "その他"が選ばれたら表示
      select_name.addEventListener("dblclick", showInput);
    } else {
      otherInput.style.display = "none";
      select_name.style.display = "inline";
      otherInput.value = ""; // 入力欄をリセット
      select_name.removeEventListener("dblclick", showInput); 
      // otherInput.style.display = "none"; // 他の選択肢なら非表示
      // otherInput.value = ""; // 入力欄をリセット
    }
});
})

const main =(async ()=>{
  voteData = await fetchVoteData();
  nameList = await fetchNameList();
  createIndex();
  setNameListAsOption();
})



main();




// 

