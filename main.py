import urllib.request
import json
import datetime
import sys
from bs4 import BeautifulSoup
import re
import yaml

VOTE_DATA_FILE = "voteData.yml"

# periodの形式はyyyy-mm-ddとする
def create_vote_deta(url, period):
  if url is None or period is None:
    return
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  if url in vote_data:
    print("既に存在します。")
    return
  data = {url:{
    'period': period, 
    'voted_num': 0,
    'send_notification': True,
    'send_notification_at_night': False
    }}
  with open(VOTE_DATA_FILE, 'a') as yml:
    yaml.dump(data, yml, encoding='utf-8', allow_unicode=True)



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
  print(new_voted_member)
  
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
  if len(args) == 3:
    create_vote_deta(args[1], args[2])
  elif len(args) == 1:
    for url in vote_data.keys():
      comfirm_vote_data(url, vote_data[url])
  else:
    exit("引数の数が異なります。")
    
    