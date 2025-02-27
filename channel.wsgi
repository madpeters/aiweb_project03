import sys
import os

# Get the directory of the current file
current_directory = os.path.dirname(os.path.abspath(__file__))

# Add the project directory to the sys.path
sys.path.insert(0, current_directory)

# Set the FLASK_APP environment variable
os.environ['FLASK_APP'] = 'channel'

# Import the Flask app
from channel import app as application