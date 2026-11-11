# Presentation Squad

A Discord game and web platform where participants give presentations on random or custom topics under the watchful eye of a firing squad. 

## Features
- **Discord Integration:** Slash commands (`/start-game`, `/roll-dice`) to initialize game rooms and handle D(N) rolls based on active players and ghosts.
- **Web Host Companion (`room.html`):** Live presentation slide display, director's terminal, and video feed slot for streaming or screen-sharing.
- **Ghost-Weighted Voting:** Eliminators who survive longer get higher ghost voting weights ($1 - 1/2^k$), guaranteeing zero ties while rewarding endurance.
- **Optional Randomization:** Designated dice rollers can either input custom slide prompts or toggle full procedural randomization.

## Quick Start
1. Install dependencies: `npm install`
2. Configure `.env` with your Discord Bot Token.
3. Start the server: `npm start`
4. Use `/start-game` and `/roll-dice` in your Discord server.
