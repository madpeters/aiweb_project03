import sys
import os

# Get the directory of the current file
current_directory = os.path.dirname(os.path.abspath(__file__))

# Add the project directory to the sys.path
sys.path.insert(0, current_directory)

# Set the environment variable for Flask
os.environ['FLASK_APP'] = 'channel.py'
os.environ['FLASK_ENV'] = 'production'

# Import the Flask app
from channel import app as application
