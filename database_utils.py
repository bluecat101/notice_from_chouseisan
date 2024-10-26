import pykakasi
import yaml
import slack
import datetime

VOTE_DATA_FILE = "vote_data.yml"
NAME_TO_SLACK_ID_FILE = "name_to_slack_id.yml"


### voteData.yml ###

# periodの形式はyyyy-mm-ddとする
# atgsにはname,slack_idが入る
def create_vote_deta(url, period, send_notification = True, send_notification_at_night = False,name = None):
  if url is None or period is None or name is None:
    return
  if type(period) is str: # 型変換
    period = datetime.datetime.strptime(period, "%Y-%m-%d").date()
  elif not(type(period) is datetime.date): # datetime型以外ならreturn
    return False
  
  vote_data = get_vote_data()
  if url in vote_data:
    print("既に存在します。")
    return False
  # データの作成
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
  return True

def get_vote_data():
  with open(VOTE_DATA_FILE, 'r') as yml:
    vote_data = yaml.safe_load(yml)
  return vote_data

# 更新する要素は{更新するkey: 値}で受け取る
def update_vote_data(url=None, args={}): # argsは辞書型
  if url is None:
    return
  vote_data = get_vote_data()
  for key,value in args.items(): # 更新
    if(key in vote_data[url]):
      vote_data[url][key] = value  
  with open(VOTE_DATA_FILE, 'wb') as yml:
    yaml.dump(vote_data, yml, encoding='utf-8', allow_unicode=True)
  return True

def delete_vote_deta(url=None):
  if url is None:
    return
  vote_data = get_vote_data()
  del vote_data[url] # 削除
  with open(VOTE_DATA_FILE, 'wb') as yml:
    yaml.dump(vote_data, yml, encoding='utf-8', allow_unicode=True)
  return True
  
### name_list.yml ###

def convert_name_to_slack_member_id_key(name):
  kakasi = pykakasi.kakasi() # 英語表記にする
  name_at_roman = kakasi.convert(name)[0]["passport"]
  return name_at_roman.upper() + "_SLACK_MEMBER_ID" # slack_idを呼ぶためのkey名
  
  
def create_name_to_slack_id(name, slack_member_id_key):
  # 既存の名前を取得
  name_list = get_name_to_slack_id_data()
  if name in name_list: # すでに名前が登録されていれば抜ける
    return False
  # 名前を追加
  data = {name: slack_member_id_key}
  with open(NAME_TO_SLACK_ID_FILE, 'a') as yml: # ファイルの更新
    yaml.dump(data, yml, encoding='utf-8', allow_unicode=True)
  return True


def get_name_to_slack_id_data():
  with open(NAME_TO_SLACK_ID_FILE, 'r') as yml:
    name_to_slack_id = yaml.safe_load(yml)
  return name_to_slack_id
