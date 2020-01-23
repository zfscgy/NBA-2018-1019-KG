from flask import Flask, request
# from flask_cors import CORS
from Backend.GameReader import GameReader
app = Flask(__name__, static_url_path="", static_folder="../Web/")
# CORS(app)
gr = GameReader("./Data/Games")

@app.route("/api/game")
def get_game():
    game_str = request.args.get("id")
    return gr.get_game(game_str)

@app.route("/api/gameList")
def get_game_list():
    host_team = request.args.get("host_team")
    guest_team = request.args.get("guest_team")
    return gr.get_game_list(host_team, guest_team)

app.run(port=80)