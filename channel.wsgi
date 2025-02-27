## from channel import app
## application = app


import sys
import os

## get directory of current file
current_directory = os.path.dirname(os.path.abspath(__file__))

## add project directory to sys.path 
sys.path.insert(1, '/home/u064/public_html/project3/aiweb_project03')

os.chdir('/home/u096/public_html/project3/aiweb_project03')

os.environ['FLASK_APP'] = 'channel.py'

## import flask app
from channel import app as application
