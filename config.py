import os
from dotenv import load_dotenv
import dotenv

load_dotenv()
### Slack用 ###
# Slackへの送信用のトークン
SLACK_API_TOKEN = os.getenv("SLACK_API_TOKEN")
# キーが見つからない場合にはNoneとなる
def getenv(key):
  load_dotenv()
  return os.getenv(key)

def set_key(key, value):
  dotenv_file = dotenv.find_dotenv()
  dotenv.set_key(dotenv_file, key, value)