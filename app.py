#!flask/bin/python
from flask import Flask, request, make_response, Response
import codecs

app = Flask(__name__)

def get_file_content(file_name):
    file_object = codecs.open(file_name, "r", "utf-8")
    try:
        all_the_text = file_object.read( )
    finally:
        file_object.close( )
    return all_the_text

def response(file_name):

    content = get_file_content(file_name)

    jsonp_callback =  request.args.get('callback', '')
    if jsonp_callback:
        content = "%s(%s);" % (jsonp_callback, content)

    resp = make_response(content)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'
    resp.headers['Access-Control-Allow-Methods'] = 'GET'
    resp.headers['mimetype'] = 'text/javascript'

    return resp

@app.route('/version')
def version():
    return response("app/version.json");

@app.route('/applist')
def applist():
    return response("app/applist.json")

@app.route('/wifilist')
def wifilist():
    return response("app/wifilist.json")

@app.route('/kulianwifi')
def kulianwifi():
    return response("app/kulianwifi.json")

@app.route('/appdetail')
def appdetail():
    appid=request.args.get('appid',0)
    return response("app/appdetail"+appid+".json")

@app.route('/appverifycode')
def verifycode():
    return response("app/success.json")

@app.route('/appregister')
def register():
    return response("app/success.json")

@app.route('/applogin')
def login():
    return response("app/login.json")

@app.route('/appad')
def ads():
    return response("app/ads.json")

@app.route('/books')
def books():
    return response("app/books.json")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug = True)
