import config
import yaml
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

NAME_TO_SLACK_ID_FILE = "name_list.yml"

# SlackBot用のトークンとチャンネル
SLACK_API_TOKEN  = config.SLACK_API_TOKEN
def get_slack_id_from_name(name):
  with open(NAME_TO_SLACK_ID_FILE, 'r') as yml: # name_list, envファイルに追加する
    name_to_slack_id = yaml.safe_load(yml)
  return config.getenv(name_to_slack_id[name])

def send_message(name, message):
  SLACK_MEMBER_ID = get_slack_id_from_name(name)
  client = WebClient(token=SLACK_API_TOKEN)
  try:
    response = client.chat_postMessage(
        channel=SLACK_MEMBER_ID,
        text=message,
    )
  except SlackApiError as e:
    print(f"Got an error: {e.response['error']}")

if __name__ == "__main__":
  send_message("name","test message")