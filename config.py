import os
from dotenv import load_dotenv

load_dotenv()

### Slack用 ###
# Slackへの送信用のトークン
SLACK_API_TOKEN = os.getenv("SLACK_API_TOKEN")
# Slackのチャンネル
SLACK_CHANNEL_ID  = os.getenv("SLACK_CHANNEL_ID")