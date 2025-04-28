from flask import Flask, request, Response, stream_with_context
import os
from google import genai
from google.genai import types
import json
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
api_key = "AIzaSyD85wqHn_oJXY4hp24oDCgo0BpBfaKaBac"

# Function to find a winning move
def find_winning_move(grid, symbol, win_length):
    n = len(grid)
    
    for r in range(n):
        for c in range(n - win_length + 1):
            segment = grid[r][c:c + win_length]
            if segment.count(symbol) == win_length - 1 and '-' in segment:
                return (r, c + segment.index('-')), "horizontal"

    for c in range(n):
        for r in range(n - win_length + 1):
            segment = [grid[r + i][c] for i in range(win_length)]
            if segment.count(symbol) == win_length - 1 and '-' in segment:
                return (r + segment.index('-'), c), "vertical"

    for r in range(n - win_length + 1):
        for c in range(n - win_length + 1):
            segment = [grid[r + i][c + i] for i in range(win_length)]
            if segment.count(symbol) == win_length - 1 and '-' in segment:
                return (r + segment.index('-'), c + segment.index('-')), "diagonal"

    for r in range(n - win_length + 1):
        for c in range(win_length - 1, n):
            segment = [grid[r + i][c - i] for i in range(win_length)]
            if segment.count(symbol) == win_length - 1 and '-' in segment:
                return (r + segment.index('-'), c - segment.index('-')), "diagonal"

    return None

def generate_stream(grid, symbol, win_length):
    n = len(grid)
    
    # Determine the prompt based on winning move logic
    win = find_winning_move(grid, symbol, win_length)
    if win is None:
        question = f"""This is a TicTacToe game with a twist. It is a {n}x{n} grid with winning length {win_length}. The board state is as follows:
{grid}

Explain why there is no winning move for the player {symbol} in this current position.
"""
    else:
        (win_pos, direction) = win
        question = f"""This is a TicTacToe game with a twist. It is a {n}x{n} grid with winning length {win_length}. The board state is as follows:
{grid}

Act as a player in the game and you have just found out the winning move. Write out the current board position and the board position after placing {symbol} at row {win_pos[0]+1} and column {win_pos[1]+1} (index starts from 1). Show how there are {win_length} {symbol} in a row {direction}ly."""

    
    client = genai.Client(api_key=api_key)
    model = "gemma-3-27b-it"

    contents = [types.Content(role="user", parts=[types.Part.from_text(text=question)])]
    
    config = types.GenerateContentConfig(
        temperature=0,
        top_p=0.95,
        top_k=64,
        max_output_tokens=2048,
        response_mime_type="text/plain",
    )

    # Stream the output from the model
    def event_stream():
        for chunk in client.models.generate_content_stream(model=model, contents=contents, config=config):
            yield f"data: {json.dumps({'text': chunk.text})}\n\n"

    return Response(stream_with_context(event_stream()), content_type="text/event-stream")

@app.route("/generate", methods=["POST"])
@cross_origin()
def generate():
    data = request.get_json()
    grid = data["grid"]
    symbol = data["symbol"]
    win_length = data["win_length"]
    n = data["grid_length"]
    grid = ["-" if x is None else x for x in grid]
    grid = [grid[i * n:(i + 1) * n] for i in range(n)]
    print("n:", n)
    print("Grid:", grid)
    print("Symbol:", symbol)
    print("Win Length:", win_length)
    return generate_stream(grid, symbol, win_length)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)