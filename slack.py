import config
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


# SlackBot用のトークンとチャンネル
SLACK_API_TOKEN  = config.SLACK_API_TOKEN
SLACK_CHANNEL_ID  = config.SLACK_CHANNEL_ID


def send_message(message):
  client = WebClient(token=SLACK_API_TOKEN)
  try:
    response = client.chat_postMessage(
        channel=SLACK_CHANNEL_ID,
        text=message,
    )
  except SlackApiError as e:
    print(f"Got an error: {e.response['error']}")

if __name__ == "__main__":
  send_message("test")