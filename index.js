const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// --- Express & Socket.io Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// Game sessions in memory
const sessions = {}; // roomId -> session state

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_room', ({ roomId, username, password }) => {
        socket.join(roomId);
        if (!sessions[roomId]) {
            sessions[roomId] = {
                roomId,
                currentPresenter: null,
                topic: "Waiting for Dice Roll...",
                isRandom: true,
                slides: [],
                votes: {},
                players: {}
            };
        }
        socket.emit('game_state', sessions[roomId]);
    });

    socket.on('update_deck', ({ roomId, topic, slides, isRandom }) => {
        if (sessions[roomId]) {
            sessions[roomId].topic = topic;
            sessions[roomId].slides = slides;
            sessions[roomId].isRandom = isRandom;
            io.to(roomId).emit('deck_updated', sessions[roomId]);
        }
    });

    socket.on('submit_vote', ({ roomId, voterId, targetId, weight }) => {
        if (sessions[roomId]) {
            sessions[roomId].votes[voterId] = { targetId, weight };
            io.to(roomId).emit('votes_updated', sessions[roomId].votes);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// --- Discord Bot Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('start-game')
        .setDescription('Initialize a Presentation Squad game lobby and web room.')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('roll-dice')
        .setDescription('Roll the D(N) die to pick presenter & presentation config.')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || 'MOCK_TOKEN');

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const roomId = interaction.channelId;

    if (commandName === 'start-game') {
        const passKey = Math.random().toString(36.substring(2, 8)).toUpperCase();
        if (!sessions[roomId]) {
            sessions[roomId] = {
                roomId,
                passKey,
                currentPresenter: null,
                topic: "Lobby Open - Awaiting Dice Roll",
                isRandom: true,
                slides: ["State Mandate #1", "Graphs That Go Up", "Unquestionable Compliance"],
                votes: {},
                players: {}
            };
        }

        const embed = new EmbedBuilder()
            .setTitle('🏛️ PRESENTATION SQUAD: INITIALIZED')
            .setDescription(`Game lobby active in this channel.\n\n**Login Portal:** [Access Web Deck](${process.env.BASE_URL || 'http://localhost:3000'}/room.html?room=${roomId})\n**Room Code / Channel ID:** \`${roomId}\`\n**Session Passkey:** \`${passKey}\``)
            .setColor(0x8B0000);

        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'roll-dice') {
        const session = sessions[roomId];
        if (!session) {
            return interaction.reply({ content: 'No active game session! Run /start-game first.', ephemeral: true });
        }

        // Simulate D(N) roll
        const participants = ['Player_1', 'Player_2', 'Player_3', 'Player_4']; // Mock pool
        const rollResult = Math.floor(Math.random() * participants.length) + 1;
        const designatedRoller = participants[rollResult - 1];
        
        session.currentPresenter = designatedRoller;

        const embed = new EmbedBuilder()
            .setTitle('🎲 TRIBUNAL DICE ROLL')
            .setDescription(`Rolled **[ ${rollResult} ]** out of ${participants.length} entities.\n\n**Designated Roller & Presenter:** \`${designatedRoller}\`\n\nLog into the web dashboard to configure your slide deck or trigger full procedural randomization!`)
            .setColor(0xFF4500);

        await interaction.reply({ embeds: [embed] });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Presentation Squad server running on port ${PORT}`);
});
