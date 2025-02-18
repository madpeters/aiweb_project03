## channel.py - a simple message channel
##

from flask import Flask, request, render_template, jsonify
import json
import requests
from datetime import datetime, timedelta
from flask_cors import CORS
from better_profanity import profanity #mp added unwanted words

# mp Initialize the profanity filter
profanity.load_censor_words()


# Class-based application configuration
class ConfigClass(object):
    """ Flask application config """

    # Flask settings
    SECRET_KEY = 'This is an INSECURE secret!! DO NOT use this in production!!'

# Create Flask app
app = Flask(__name__)
app.config.from_object(__name__ + '.ConfigClass')  # configuration
app.app_context().push()  # create an app context before initializing db
# Initialize CORS to allow requests from React app (frontend)
CORS(app)
CORS(app, origins="http://localhost:3000")


HUB_URL = 'http://localhost:5555'
HUB_AUTHKEY = '1234567890'
CHANNEL_AUTHKEY = '0987654321'
CHANNEL_NAME = "Talking Houseplants" # mp name of the channel changed
CHANNEL_ENDPOINT = "http://localhost:5001" # don't forget to adjust in the bottom of the file
CHANNEL_FILE = 'messages.json'
CHANNEL_TYPE_OF_SERVICE = 'aiweb24:chat'


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
    # check if Authorization header is present
    if 'Authorization' not in request.headers:
        return False
    # check if authorization header is valid
    if request.headers['Authorization'] != 'authkey ' + CHANNEL_AUTHKEY:
        return False
    return True

@app.route('/health', methods=['GET'])
def health_check():
    global CHANNEL_NAME
    if not check_authorization(request):
        return "Invalid authorization", 400
    return jsonify({'name':CHANNEL_NAME}),  200

# GET: Return list of messages
@app.route('/', methods=['GET'])
def home_page():
    if not check_authorization(request):
        return "Invalid authorization", 400
    # mp welcome message added if the user enters the channel the first time
    # messages = read_messages()
    # if not messages:
    #     welcome_message = {
    #         'content': 'Welcome to Houseplant Chat—your cozy corner for all things green! Whether you are a seasoned plant parent or just starting your journey, dive in to share tips, swap stories, and celebrate every little leaf. Let’s grow together!',
    #         'sender': 'System',
    #         'timestamp': datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"),
    #         'extra': None,
    #         'pinned': False
    #     }
    #     messages.append(welcome_message)
    #     save_messages(messages)
    # return jsonify(messages)
    # fetch channels from server
    return jsonify(read_messages())

# POST: Send a message
@app.route('/', methods=['POST'])
def send_message():
    # fetch channels from server
    # check authorization header
    if not check_authorization(request):
        return "Invalid authorization", 400
    # check if message is present
    message = request.json
    if not message:
        return "No message", 400
    content = message.get('content', '')
    if not 'content' in message:
        return "No content", 400
    if not 'sender' in message:
        return "No sender", 400
    if not 'timestamp' in message:
        return "No timestamp", 400
    # Check for unwanted words
    if not filter_message(content):
        return "Message contains inappropriate content", 400
    if not 'extra' in message:
        extra = None
    else:
        extra = message['extra']
    timestamp = message.get('timestamp', datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"))
    # add message to messages
    messages = read_messages()
    messages.append({'content': message['content'],
                     'sender': message['sender'],
                     'timestamp': timestamp,
                     'extra': extra,
                        'pinned': False,
                     })
    delete_old_messages()
    save_messages(messages)
    return "OK", 200

def read_messages():
    global CHANNEL_FILE
    try:
        f = open(CHANNEL_FILE, 'r')
    except FileNotFoundError:
        return []
    try:
        messages = json.load(f)
    except json.decoder.JSONDecodeError:
        messages = []
    f.close()
    return messages

def save_messages(messages):
    global CHANNEL_FILE
    with open(CHANNEL_FILE, 'w') as f:
        json.dump(messages, f)

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
def delete_old_messages():
    one_day_ago = datetime.now() - timedelta(days=1)
    messages = read_messages()
    
    # Keep only messages that are either pinned or within the last day
    filtered_messages = [
        msg for msg in messages
        # mp fixed timestamp format to match the strptime format
        if msg.get('pinned', False) or datetime.strptime(msg['timestamp'], "%Y-%m-%dT%H:%M:%S.%f") > one_day_ago
    ]
    
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

# mp added welcome message on top of the messages
def send_welcome_message():
    welcome_message = {
        'content': 'Welcome to Houseplant Chat—your cozy corner for all things green! Whether you are a seasoned plant parent or just starting your journey, dive in to share tips, swap stories, and celebrate every little leaf. Let’s grow together!',
        'sender': 'Houseplant Bot',
        'timestamp': datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f"),
        'extra': None,
        'pinned': False
    }
    messages = read_messages()

    # Check if the welcome message already exists
    if not messages or messages[0]['content'] != welcome_message['content']:
        messages.insert(0, welcome_message)  # Insert the welcome message at the beginning
        save_messages(messages)



if __name__ == '__main__':
    send_welcome_message()
    app.run(port=5001, debug=True)
