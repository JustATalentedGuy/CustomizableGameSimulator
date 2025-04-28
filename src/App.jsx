import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import Room from './components/Room';
import TicTacToe from './components/TicTacToe';
import { WebSocketProvider } from "./components/WebsocketContext";
import SnakeAndLadder from './components/SnakeAndLadder';
import Connect4 from './components/Connect4';
import Account from './components/Account';
import MainLayout from './components/MainLayout';
import { AuthProvider } from './components/AuthContext';
import RoomLayout from './components/RoomLayout';
import './App.css';
import MemoryGame from './components/Memory';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <WebSocketProvider>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={<MainLayout />}>
                            <Route path="/create-room" element={<CreateRoom />} />
                            <Route path="/join-room" element={<JoinRoom />} />
                            <Route path="/account" element={<Account />} />
                        </Route>
                        <Route element={<RoomLayout />}>
                            <Route path="/room/:roomName" element={<Room />} />
                            <Route path="/game/tic-tac-toe/:roomName" element={<TicTacToe />} />
                            <Route path="/game/snake-and-ladder/:roomName" element={<SnakeAndLadder />} />
                            <Route path="/game/connect-4/:roomName" element={<Connect4 />} />
                            <Route path="/game/memory/:roomName" element={<MemoryGame/>} />
                        </Route>
                    </Routes>
                </WebSocketProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;