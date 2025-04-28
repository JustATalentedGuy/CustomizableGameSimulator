# CustomizableGameSimulator

Hosting simple 2-player games in private rooms using Websockets, customizable rules, and board configurations.

---

## Project Setup Instructions

You need to run **three terminals** to properly host and run the application.

---

### Step 1: Clone and Setup the Project

```
git clone https://github.com/JustATalentedGuy/CustomizableGameSimulator.git
cd CustomizableGameSimulator
python update_env.py
npm run dev
```

> **Terminal 1:** Runs the React Frontend Server.

---

### Step 2: Setup and Run WebSocket Backend (Django Channels)

Open a **second terminal**:

```
cd CustomizableGameSimulator/Websockets
pip install -r requirements.txt
cd backend
daphne -b x.x.x.x -p 8000 backend.asgi:application
```

> **Terminal 2:** Runs the Daphne server for WebSocket communication (ASGI application).

---

### Step 3: Run the Flask App

Open a **third terminal**:

```
cd CustomizableGameSimulator/Websockets
python flask_app.py
```

> **Terminal 3:** Runs the Flask server for using the Gemini API for hints (optional).

---

## Features

- Private Rooms Creation
- Private Group Chats for players in the Room
- JWT authentication for all users of the application
- Available Games:
  - Tic Tac Toe
  - Snake And Ladder
  - Connect4
  - Memory
- Rule customization
- Board customization (with custom images)

---
## Important Notes

- Make sure `python`, `pip`, and `npm` are installed and available in your system path.
- Update `x.x.x.x` to your **local IP address**.
- It is recommended to use a Python virtual environment (`venv`) for backend dependencies.

---

## PREVIEW

Login:
![Screenshot 2025-04-23 215442](https://github.com/user-attachments/assets/dc635fb0-c3df-41c5-b2e2-37e901a16f17)


Room Creation/Joining:
![Screenshot 2025-04-23 215709](https://github.com/user-attachments/assets/44327c2f-8903-4a9f-a2bd-e34fd1fc8327)


Game Selection and Customization:
![Screenshot 2025-04-23 215816](https://github.com/user-attachments/assets/28a06132-8efe-4577-93ac-3808b0377e7f)


Memory Game:

![Screenshot 2025-04-23 222250](https://github.com/user-attachments/assets/81a87f02-e106-4dec-b3d5-4057b24117b3)


Connect4:
![Screenshot 2025-04-23 222542](https://github.com/user-attachments/assets/b1a358b0-8efd-4331-9b18-e965606176f5)


TicTacToe:
![Screenshot 2025-04-23 223026](https://github.com/user-attachments/assets/9d14ed71-fc37-4638-b562-cd4ac699ef88)

---
