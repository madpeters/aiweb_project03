## channel.py - a simple message channel
##

from flask import Flask, request, render_template, jsonify
import json
import requests
from datetime import datetime, timedelta
from flask_cors import CORS
from better_profanity import profanity  #mp added unwanted words

# mp Initialize the profanity filter
profanity.load_censor_words()


# Class-based application configuration
class ConfigClass(object):
    """ Flask application config """

    # Flask settings
    SECRET_KEY = 'This is an INSECURE secret!! DO NOT use this in production!!'

# Create Flask app
#app = Flask(__name__)
app = Flask(__name__, static_folder='chat_client/build', static_url_path='/')
app.config.from_object(__name__ + '.ConfigClass')  # configuration
app.app_context().push()  # create an app context before initializing db
# Initialize CORS to allow requests from React app (frontend)
CORS(app)
CORS(app, origins="http://localhost:3000")


#HUB_URL = 'http://localhost:5555'
HUB_URL = 'http://vm146.rz.uni-osnabrueck.de/hub'
HUB_AUTHKEY = 'Crr-K24d-2N'
#HUB_AUTHKEY = '1234567890'
CHANNEL_AUTHKEY = '0987654321'
CHANNEL_NAME = "Talking Houseplants 🌱" # mp name of the channel changed
#CHANNEL_ENDPOINT = "http://localhost:5001" # don't forget to adjust in the bottom of the file
CHANNEL_ENDPOINT = "http://vm146.rz.uni-osnabrueck.de/u064/project3/aiweb_project03/channel.wsgi/"
CHANNEL_FILE = 'messages.json'
CHANNEL_TYPE_OF_SERVICE = 'aiweb24:houseplant_chat'


MAX_MESSAGES = 100  # Limit the number of messages stored
#UNWANTED_WORDS = ['badword1', 'badword2']  # List of offensive mp: not used anymore since we use profanity package

@app.cli.command('register')
def register_command():
    global CHANNEL_AUTHKEY, CHANNEL_NAME, CHANNEL_ENDPOINT

    # send a POST request to server /channels
    response = requests.post(HUB_URL + '/channels', headers={'Authorization': 'authkey ' + HUB_AUTHKEY},
                             data=json.dumps({
                                "name": CHANNEL_NAME,
                                "endpoint": CHANNEL_ENDPOINT,
                                "authkey": CHANNEL_AUTHKEY,
                                "type_of_service": CHANNEL_TYPE_OF_SERVICE,
                             }))

    if response.status_code != 200:
        print("Error creating channel: "+str(response.status_code))
        print(response.text)
        return

def check_authorization(request):
    global CHANNEL_AUTHKEY
    
    # Print request headers (for debugging purposes)
    print("Request Headers:", request.headers)

    # Check if Authorization header is present
    if 'Authorization' not in request.headers:
        print("Authorization header missing.")
        return False
    
    # Check if authorization header is in the correct format
    expected_auth = 'authkey ' + CHANNEL_AUTHKEY
    received_auth = request.headers['Authorization']
    
    # Log received and expected auth values for debugging
    print(f"Expected Authorization: {expected_auth}")
    print(f"Received Authorization: {received_auth}")
    
    # Check if the authorization header is valid
    if received_auth != expected_auth:
        print("Invalid Authorization key.")
        return False
        
    return True


@app.route('/health', methods=['GET'])
def health_check():
    global CHANNEL_NAME
    if not check_authorization(request):
        return "Invalid authorization 1", 400
    return jsonify({'name':CHANNEL_NAME}),  200





# GET: Return list of messages
@app.route('/', methods=['GET'])
def home_page():
    if not check_authorization(request):
        return "Invalid authorization2 ", 400
    return jsonify(read_messages())

@app.route('/messages', methods=['GET'])
def get_messages():
    channel_name = request.args.get('channel')  # Use channelName instead of channelId
    print(channel_name)
    if not channel_name:
        return jsonify({"error": "Channel name is required"}), 400
    
    # Fetch messages for the specified channel
    messages = read_messages_for_channel(channel_name)
    return jsonify(messages)



# POST: Send a message
#@app.route('/', methods=['POST'])
#def send_message():
    # fetch channels from server
    # check authorization header
#    if not check_authorization(request):
#        return "Invalid authorization", 400
    # check if message is present
#    message = request.json
#    if not message:
#        return "No message", 400
#    content = message.get('content', '')
#    if not 'content' in message:
#        return "No content", 400
#    if not 'sender' in message:
#        return "No sender", 400
#    if not 'timestamp' in message:
#        return "No timestamp", 400
    # Check for unwanted words
#    if not filter_message(content):
#        return "Message contains inappropriate content", 400
#    if not 'extra' in message:
#        extra = None
#    else:
#        extra = message['extra']
#    timestamp = message.get('timestamp', datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"))
    # add message to messages
#    messages = read_messages()
#    messages.append({'content': message['content'],
#                     'sender': message['sender'],
#                     'timestamp': timestamp,
#                     'extra': extra,
#                        'pinned': False,
#                     })
#    delete_old_messages()
#    save_messages(messages)
#    return "OK", 200

# POST: Send a message
@app.route('/messages', methods=['POST'])
def send_message():
    print("Received data:", request.json)
    
    if not check_authorization(request):
        return "Invalid authorization", 400
    
    # Check if message is present
    message = request.json
    if not message:
        return "No message", 400

    content = message.get('content')
    sender = message.get('sender')
    timestamp = message.get('timestamp')
    channel_name = message.get('name')  # Use channelName instead of channelId

    if not content:
        return "No content", 400
    if not sender:
        return "No sender", 400
    if not timestamp:
        timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f") 
    if not channel_name:  # Make sure channelName is provided
        return "No channelName", 400
    
    # Check for unwanted words / profanity filter
    if not filter_message(content):  # Use filter_message function to check for profanity
        return "Message contains inappropriate content", 400
    
    print(f"Received message for channel {channel_name}: {content}")

    response_message = generate_houseplant_response(content)  # Active response for houseplants

    extra = message.get('extra', None)

    # Add message to messages list
    messages = read_messages()
    messages.append({
        'content': content,
        'sender': sender,
        'timestamp': timestamp,
        'extra': extra,
        'channel_name': channel_name,  # Use channel_name instead of channelId
        'response': response_message,
        'pinned': False,
    })
    
    # Delete old messages if necessary
    delete_old_messages()
    save_messages(messages)
    
    return "OK", 200



def read_messages():
    global CHANNEL_FILE
    try:
        with open(CHANNEL_FILE, 'r', encoding='utf-8') as f:
            messages = json.load(f)
    except FileNotFoundError:
        return []
    except json.decoder.JSONDecodeError:
        messages = []
    f.close()
    return messages

# Function to read messages for a specific channel
def read_messages_for_channel(channel_name):
    messages = read_messages()  # Fetch all messages
    #channel_messages = [msg for msg in messages if msg['channel_name'] == channel_name]
    return messages


def save_messages(messages):
    global CHANNEL_FILE
    try:
        with open(CHANNEL_FILE, 'w', encoding='utf-8') as f:
            json.dump(messages, f,ensure_ascii=False)
        print("Messages successfully saved!")
    except Exception as e:
        print(f"Error saving messages: {e}")

# Pin a message
@app.route('/pin', methods=['POST'])
def pin_message():
    message_data = request.json
    timestamp = message_data.get('timestamp', '')
    
    if not timestamp:
        return "No timestamp provided", 400

    messages = read_messages()
    
    for message in messages:
        if message['timestamp'] == timestamp:
            message['pinned'] = True
            save_messages(messages)
            return jsonify({"message": "Message pinned successfully!"}), 200
    
    return "Message not found", 404

# Delete messages older than 1 day (except pinned ones)
from datetime import datetime, timedelta

def delete_old_messages():
    one_day_ago = datetime.now() - timedelta(days=1)
    messages = read_messages()

    filtered_messages = []
    for msg in messages:
        try:
            timestamp = msg.get('timestamp')
            if timestamp:
                # Ensure the timestamp is in the correct format before comparing
                try:
                    msg_time = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%f")
                except ValueError:
                    print(f"Skipping message with invalid timestamp format: {timestamp}")  # Log the bad timestamp
                    filtered_messages.append(msg)  # Optionally, keep messages with bad timestamps
                    continue

                # If the message is pinned or within the last day, keep it
                if msg.get('pinned', False) or msg_time > one_day_ago:
                    filtered_messages.append(msg)
            else:
                # Handle missing timestamps if necessary
                print(f"Skipping message with missing timestamp: {msg}")
                filtered_messages.append(msg)  # Optionally keep messages with no timestamp
        except Exception as e:
            print(f"Error processing message: {e}")  # Catch any other errors and log them
            filtered_messages.append(msg)  # Keep the message in case of error
    
    save_messages(filtered_messages)

def filter_message(content):
    return not profanity.contains_profanity(content)
    # for word in UNWANTED_WORDS:
    #     if word in content.lower():
    #         return False  # Reject message if it contains an unwanted word
    # return True

@app.route('/search', methods=['GET'])
def search_messages():
    query = request.args.get('query', '').lower()
    if not query:
        return "No query provided", 400
    
    messages = read_messages()
    matching_messages = [msg for msg in messages if query in msg['content'].lower()]
    return jsonify(matching_messages)

# Start development web server
# run flask --app channel.py register
# to register channel with hub

WELCOME_MESSAGE_CONTENT = f"Welcome to Houseplant Chat — your cozy corner for all things green! Whether you are a seasoned plant parent or just starting your journey, dive in to share tips, swap stories, and celebrate every little leaf. Let’s grow together!"
HOUSEPLANT_TIPS = [  # houseplant tips for active responses
    "Water your houseplants based on their specific needs. Overwatering is a common problem!",
    "Most houseplants prefer bright, indirect sunlight. Avoid direct afternoon sun which can scorch leaves.",
    "Use well-draining potting mix to ensure healthy roots.",
    "Fertilize your houseplants during the growing season (spring and summer) to encourage growth.",
    "Regularly check your plants for pests and diseases.",
    "Different houseplants have different humidity needs. Grouping plants together can help increase humidity.",
    "Pruning can encourage bushier growth and remove dead or yellowing leaves."
]

# mp added welcome message on top of the messages
def send_welcome_message():
    welcome_message = {
        'content': WELCOME_MESSAGE_CONTENT,
        'sender': 'Houseplant Bot',
        'timestamp': datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"),
        'extra': None,
        'pinned': False,
        'response' : None # Welcome message has no response
    }
    messages = read_messages()

    # Check if the welcome message already exists
    if not messages or messages[0]['content'] != welcome_message['content']:
        messages.insert(0, welcome_message)  # Insert the welcome message at the beginning
        save_messages(messages)

def generate_houseplant_response(user_message): # Active response function for houseplants # Added - Active response function
    """Generates a simple houseplant tip or response based on user message content.""" # Added - Docstring
    user_message_lower = user_message.lower()

    if "water" in user_message_lower:
        return "💧 Remember to check the soil moisture before watering your houseplants. Most prefer the top inch of soil to dry out between waterings."
    elif "sunlight" in user_message_lower or "light" in user_message_lower:
        return "☀️  Houseplants thrive in bright, indirect sunlight. Consider the light requirements of your specific plant."
    elif "fertilize" in user_message_lower or "fertiliser" in user_message_lower or "feed":
        return "🌱 During the growing season (spring/summer), fertilizing every 2-4 weeks can boost your houseplant's health."
    elif "pest" in user_message_lower or "bugs" in user_message_lower or "disease" in user_message_lower:
        return "🔎 Regularly inspect your houseplants for pests and diseases. Early detection is key to treatment!"
    elif "tip" in user_message_lower or "advice" in user_message_lower or "help":
        import random
        return f"💡 Houseplant Tip: {random.choice(HOUSEPLANT_TIPS)}" # Random tip from list
    else:
        return "🌿  That's interesting!  Tell me more about your houseplants." # General response

if __name__ == '__main__':
    send_welcome_message()
    app.run(port=5001, debug=True)
