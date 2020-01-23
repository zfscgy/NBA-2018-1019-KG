import pathlib
import json

grmsg_dict = {
    "01": "加载比赛数据出错",
    "02": "未找到指定的球员"
}

def grmsg(msg="ok", data=None):
    return {
        "msg": msg,
        "data": data
    }


class GameReader:
    def __init__(self, data_dir):
        self.data_dir = pathlib.Path(data_dir)
        game_list = list(self.data_dir.iterdir())
        self.game_list = [game.name for game in game_list]
        self.game_dict = {}

    def get_game_list(self, host_team, guest_team):
        if host_team == guest_team == 0:
            return grmsg(data={"games": self.game_list})
        return_list = []
        for game in self.game_list:
            game = game.rstrip(".json")
            host_name = game.split("-")[1]
            guest_name = game.split("-")[2]
            if host_team != "" and host_team != host_name:
                continue
            if guest_team != "" and guest_team != guest_name:
                continue
            return_list.append(game)

        return grmsg(data={"games": return_list})

    def get_game(self, game_str):
        all_relations = {}
        all_players_info = {}
        def extract_relation(ev):
            if ev["relations"] is None:
                return None
            player0 = ev["player"]
            if player0 not in all_relations:
                all_relations[player0] = {}
            player0rels = all_relations[player0]
            ename = ev["name"]
            for rel in ev["relations"]:
                player1 = ev["relations"][rel]
                if player1 not in player0rels:
                    player0rels[player1] = {}
                if rel not in player0rels[player1]:
                    player0rels[player1][ename + '-' + rel] = 0
                player0rels[player1][ename + '-' + rel] += 1

        def extract_player_info(ev):
            def get_player_info_dict(_player):
                if _player not in all_players_info:
                    all_players_info[_player] = {
                        "point": [0, 0],
                        "3point": [0, 0],
                        "ft": [0, 0],
                        "rebound": [0, 0],
                        "assist": 0,
                        "steal": 0,
                        "block": 0,
                        "foul": 0,
                        "turnover": 0
                    }
                info = all_players_info[_player]
                return info
            info = get_player_info_dict(ev["player"])
            if ev["name"] == "TryPt":
                info["point"][1] += 1
                if ev["type"] == "3-pt jump shot":
                    info["3point"][1] += 1
                if ev["outcome"] == "make":
                    info["point"][0] += 1
                    if ev["type"] == "3-pt jump shot":
                        info["3point"][0] += 1

                    if ev["relations"] is not None:
                        assister = ev["relations"]["AssistedBy"]
                        assister_info = get_player_info_dict(assister)
                        assister_info["assist"] += 1
                else:
                    if ev["relations"] is not None:
                        blocker = ev["relations"]["BlockedBy"]
                        blocker_info = get_player_info_dict(blocker)
                        blocker_info["block"] += 1
            elif ev["name"] == "FreeThrow":
                freethrower = ev["player"]
                ft_info = get_player_info_dict(freethrower)
                ft_info["ft"][1] += 1
                if ev["outcome"] == "make":
                    ft_info["ft"][0] += 1
                if ev["relations"] is not None:
                    fouler = ev["relations"]["Fouler"]
                    get_player_info_dict(fouler)
            elif ev["name"] == "Rebound":
                rebounder = ev["player"]
                rebounder_info = get_player_info_dict(rebounder)
                if ev["type"] == "offensive":
                    rebounder_info["rebound"][0] += 1
                else:
                    rebounder_info["rebound"][1] += 1
            elif ev["name"] == "Foul":
                fouler = ev["player"]
                fouler_info = get_player_info_dict(fouler)
                fouler_info["foul"] += 1
                if ev["relations"] is not None:
                    fouled = ev["relations"]["Fouled"]
                    get_player_info_dict(fouled)
            elif ev["name"] == "Turnover":
                turnoverer = ev["player"]
                turnoverer_info = get_player_info_dict(turnoverer)
                turnoverer_info["turnover"] += 1
                if ev["relations"] is not None:
                    stealer = ev["relations"]["StolenBy"]
                    stealer_info = get_player_info_dict(stealer)
                    stealer_info["steal"] += 1

        if game_str + ".json" not in self.game_list:
            return grmsg("01")
        game = json.load(open(self.data_dir.joinpath(game_str + ".json"), "r"))
        for ev in game["events"]:
            extract_relation(ev)
            extract_player_info(ev)

        # Convert player name to legal string for html elements
        def convert_name(name: str):
            name = name.replace(". ", "_")
            name = name.replace(" - ", "__")
            return name

        player2team = {}
        for player in game["players"]:
            team = player.split(" - ")[1]
            if team == game["HomeTeam"]:
                player2team[player] = "home"
            else:
                player2team[player] = "away"

        player_list = []
        for player in all_players_info:
            if player == "":
                continue
            player_list.append({"id": convert_name(player), "name": player,
                                "hometeam": player2team[player] == "home",
                                "info": all_players_info[player]})

        relation_list = []
        for player0 in all_relations:
            for player1 in all_relations[player0]:
                if player0 == "" or player1 == "":
                    continue
                relation_list.append({"source": convert_name(player0), "target": convert_name(player1),
                                      "teammate": player2team[player0] == player2team[player1],
                                      "info": all_relations[player0][player1]})

        return grmsg(data={"players": player_list, "relations": relation_list})


if __name__ == "__main__":
    game_reader = GameReader("./Data/Games")
    game = game_reader.game_list[0][:-5]
    print(game_reader.get_game(game)["data"])
