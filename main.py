import urllib.request
import json
import datetime
import sys
from bs4 import BeautifulSoup
import re

import config
import database_utils
import slack

# slack_idはないときもある
def create_vote_data(url, period, send_notification = True, send_notification_at_night = False, name = None, slack_id=None):
  try:
    # urlが有効かを確認し、既に登録されている人数を取得する
    html_soup = get_page_content(url)
    voted_num = int(html_soup.find(id="answerCnt").get_text())  
  except:
    exit("URLが無効です。")
  
  
  # 作成できたらTrue, 作成できなかったらFalse(urlがすでにあった場合にもFalse)
  if database_utils.create_vote_data(url, period, voted_num, send_notification, send_notification_at_night, name):
    # name_list.ymlに送信先の人が初めての人ならばslack_idを参照するkeyを追加する
    slack_member_id_key = database_utils.convert_name_to_slack_member_id_key(name)
    # nameを追加したならTrue
    if database_utils.create_name_to_slack_id(name, slack_member_id_key) and slack_id is not None:
      # envファイルに追加
      config.set_key(slack_member_id_key, slack_id)

# json型に変換するためにdatetimeを文字列にする
def to_json(data):
  if isinstance(data, dict):
    for key, value in data.items():
      data[key]["period"] = data[key]["period"].strftime("%Y-%m-%d")
  return json.dumps(data)

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

def get_page_content(url):
  html = get_url_data(url)
  html_soup = BeautifulSoup(html, 'lxml')
  return html_soup

def confirm_vote_data(url="", vote_data={}):
  ### 投票ページの内容を取得 ###
  html_soup = get_page_content(url)
  # 投票人数を取得
  voted_num = int(html_soup.find(id="answerCnt").get_text())
  new_voted_num = voted_num - vote_data["voted_num"]
  # 新規の投票者がいるかを確認
  if new_voted_num < 1:
    print("新規の投票者はいません。")
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
  if not(isinstance(vote_data, dict)):
    return False
  for url, value in vote_data.items():
    today = datetime.date.today()
    if value["period"] < today:
      database_utils.delete_vote_data(url)
  

# routeingの役割
if __name__ == "__main__":
  args = sys.argv # 引数確認
  # 引数が16進数の時があるためエンコードしてデコードする
  args_bytes = " ".join(args).encode('utf-8')
  args = bytes(args_bytes).decode("utf-8").split(" ")
  # args = list(map(lambda arg: arg.replace("false", False).replace("true", True), args))
  args_len = len(args)
  check_period()
  if args_len == 1: # 投票に更新があるかを確認する
    vote_data = database_utils.get_vote_data()
    for url in vote_data.keys():
      confirm_vote_data(url, vote_data[url])
  else:
    if args[1] == "get_name_list" and args_len == 2:
      print(list(database_utils.get_name_to_slack_id_data().keys()))
    elif args[1] == "get_vote_data" and args_len == 2:
      print(to_json(database_utils.get_vote_data()))
    elif args[1] == "update_vote_data" and args_len == 4:
      database_utils.update_vote_data(args[2], json.loads(args[3]))
    elif args[1] == "delete_vote_data" and args_len == 3:
      database_utils.delete_vote_data(args[2])
    elif args[1] == "create_vote_data" and (args_len == 7 or args_len == 8):
      if args[4] == "false":
        args[4] = False
      elif args[4] == "true":
        args[4] = True
      if args[5] == "false":
        args[5] = False
      elif args[5] == "true":
        args[5] = True
      create_vote_data(args[2], args[3], args[4], args[5], *args[6:])
    else: 
      exit("引数を確認してください。")  
    
    
    