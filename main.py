import urllib.request
import json
import datetime
import sys
from bs4 import BeautifulSoup
import re

import config
import database_utils

# slack_idはないときもある
def create_vote_deta(url, period, send_notification = True, send_notification_at_night = False,name = None, slack_id=None):
  # 作成できたらTrue, 作成できなかったらFlase(urlがすでにあった場合にもFlase)
  if database_utils.create_vote_deta(url, period, send_notification, send_notification_at_night, name):
    # name_list.ymlに送信先の人が初めての人ならばslack_idを参照するkeyを追加する
    slack_member_id_key = database_utils.convert_name_to_slack_member_id_key(name)
    # nameを追加したならTrue
    if database_utils.create_name_to_slack_id(name, slack_member_id_key) and slack_id is not None:
      # envファイルに追加
      config.set_key(slack_member_id_key, slack_id)



# urlのデータを取得する
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
  database_utils.update_vote_data(url, {"voted_num": voted_num})
  message = f"""
  {"さんと".join(new_voted_member)}さんが投票してくれました。
  {url}
  """
  slack.send_message(vote_data["to"], message)
  
def check_period():
  vote_data = database_utils.get_vote_data()
  for url, value in vote_data.items():
    today = datetime.date.today()
    if value["period"] < today:
      database_utils.delete_vote_deta(url)
  
# slackでデータを送る

if __name__ == "__main__":
  args = sys.argv # 引数確認
  check_period()
  vote_data = database_utils.get_vote_data()
  if len(args) == 6:
    create_vote_deta(args[1], args[2], args[3], args[4], args[5])
  elif len(args) == 7:
    create_vote_deta(args[1], args[2], args[3], args[4], args[5], args[6])
  elif len(args) == 1:
    for url in vote_data.keys():
      comfirm_vote_data(url, vote_data[url])
  else:
    exit("引数の数が異なります。")
    
    