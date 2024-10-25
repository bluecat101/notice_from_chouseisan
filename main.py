import urllib.request
import json
import datetime
import sys
from bs4 import BeautifulSoup
import re
import yaml
import slack
import pykakasi

import config

VOTE_DATA_FILE = "voteData.yml"
NAME_TO_SLACK_ID_FILE = "name_list.yml"

# periodの形式はyyyy-mm-ddとする
# atgsにはname,slack_idが入る
def create_vote_deta(url, period, send_notification = True, send_notification_at_night = False,name = None, *args):
  if url is None or period is None or name is None:
    return
  if type(period) is str: # 型変換
    period = datetime.datetime.strptime(period, "%Y-%m-%d").date()
  elif not(type(period) is datetime.date): # datetime型以外ならreturn
    return
  # slack_idがある場合には取得する
  if len(args) > 0:
    slack_id = args[0]
    
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  if url in vote_data:
    print("既に存在します。")
    return
  data = {url:{
    'period': period, 
    'voted_num': 0,
    'is_send_notification': True,
    'is_send_notification_at_night': False,
    'to': name
    }}
  # voteData.ymlに追加
  with open(VOTE_DATA_FILE, 'a') as yml:
    yaml.dump(data, yml, encoding='utf-8', allow_unicode=True)
    
  # name_list.ymlに送信先の人が初めての人ならばslack_idを参照するkeyを追加する
  with open(NAME_TO_SLACK_ID_FILE, 'r') as yml:
    name_to_slack_id = yaml.safe_load(yml)
  name_list = list(name_to_slack_id.keys())
  if not(name in name_list):
    kakasi = pykakasi.kakasi() # 英語表記にする
    name_at_roman = kakasi.convert(name)[0]["passport"]
    name_member_slack_id_key = name_at_roman.upper() + "_SLACK_MEMBER_ID" # slack_idを呼ぶためのkey名
    name_to_slack_id[name] = name_member_slack_id_key
    # 名前を追加
    with open(NAME_TO_SLACK_ID_FILE, 'w') as yml:
      yaml.dump(name_to_slack_id, yml, encoding='utf-8', allow_unicode=True)
    # envファイルに追加
    config.set_key(name_member_slack_id_key, slack_id)
  
  



def delete_vote_deta(url=None):
  if url is None:
    return
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  del vote_data[url] # 削除
  with open(VOTE_DATA_FILE, 'wb') as yml:
    yaml.dump(vote_data, yml, encoding='utf-8', allow_unicode=True)

def update_vote_data(url, args): # argsは辞書型
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  for key,value in args.items(): # 更新
    if(key in vote_data[url]):
      vote_data[url][key] = value  
  with open(VOTE_DATA_FILE, 'wb') as yml:
    yaml.dump(vote_data, yml, encoding='utf-8', allow_unicode=True)


# curlコマンドでデータを取得する
def get_url_data(url=""):
  try:
    with urllib.request.urlopen(url) as response:
      return response.read().decode('utf-8')
  except urllib.error.URLError as e:
     print(e.reason)  

def analyze_vote_table(soup=""):
  script_tag = soup.find('script', string=re.compile(r"window\.Chouseisan\s*=")) # 
  script_content = str(script_tag)
  match = re.search(r"window\.Chouseisan\s*=\s*(\{.*?\});", script_content, re.DOTALL)
  return json.loads(match.group(1))

def comfirm_vote_data(url="", vote_data={}):
  ### 投票ページの内容を取得 ###
  html = get_url_data(url)
  html_soup = BeautifulSoup(html, 'lxml') # htmlコンテンツをid等で解析しやすいように変換
  # 投票人数を取得
  voted_num = int(html_soup.find(id="answerCnt").get_text())
  new_voted_num = voted_num - vote_data["voted_num"]
  # 新規の投票者がいるかを確認
  if new_voted_num < 1:
    print("更新分はありません")
    return
  # 投票者を取得(tableで埋め込めれている)
  table_data = analyze_vote_table(html_soup) # 辞書型となる
  members = table_data["event"]["members"]
  new_voted_member = list(map(lambda member: member["name"],members[-new_voted_num:]))
  update_vote_data(url, {"voted_num": voted_num})
  message = f"""
  {"さんと".join(new_voted_member)}さんが投票してくれました。
  {url}
  """
  slack.send_message(vote_data["to"], message)
  
def check_period():
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  for url, value in vote_data.items():
    today = datetime.date.today()
    if value["period"] < today:
      delete_vote_deta(url)
  
# slackでデータを送る

if __name__ == "__main__":
  args = sys.argv # 引数確認
  check_period()
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  if len(args) == 6:
    create_vote_deta(args[1], args[2], args[3], args[4], args[5])
  elif len(args) == 7:
    create_vote_deta(args[1], args[2], args[3], args[4], args[5], args[6])
  elif len(args) == 1:
    for url in vote_data.keys():
      comfirm_vote_data(url, vote_data[url])
  else:
    exit("引数の数が異なります。")
    
    