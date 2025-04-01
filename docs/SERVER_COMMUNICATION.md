# Server Communication System

This document explains how the game's server communication system works for storing permanent skill levels and emblem counts.

## Overview

The Tower Tapper game now uses a client-server architecture for storing permanent player progress:

- **Emblems**: A permanent currency earned during gameplay that persists between sessions
- **Permanent Skill Levels**: Skills that are purchased with emblems and remain across game sessions

**Important**: Gold and other in-game temporary progress is ONLY managed client-side. The server does not store or handle any gold-related data.

## Server-Side Components

### Database Tables

- `players`: Stores player information including emblem count (but NOT gold)
- `player_skills`: Stores permanent skill levels for each player

### Server API

The server provides the following WebSocket endpoints:

- `update_emblems`: Update the player's emblem count
- `add_emblems`: Add emblems to the player
- `update_skill`: Save/update a permanent skill level

## Client-Side Components

### PermanentSkillService

This service is responsible for:

- Connecting to the WebSocket server
- Retrieving and caching emblem count and permanent skill levels
- Sending updates for emblems and skills

### Integration with SkillStateManager

The SkillStateManager has been updated to:

- Retrieve permanent skill levels from the server when available
- Save permanent skill changes to the server
- Handle temporary in-game skills locally (including gold)
- Manage emblem counts via the server connection

## How to Use

### Connecting to the Server

The game will automatically connect to the server when a Telegram ID is provided:

```typescript
// Game initialization
const telegramId = getTelegramIdFromQueryParams();
if (telegramId) {
    const permanentSkillService = PermanentSkillService.getInstance();
    await permanentSkillService.connect(telegramId);
}
```

### Handling Emblems

To add emblems to the player (e.g., at the end of each wave):

```typescript
const skillManager = SkillStateManager.getInstance();

// Get current emblem bonus level
const emblemBonus = skillManager.getState(SkillType.EMBLEM_BONUS);

// Add emblems with bonus
skillManager.addEmblems(1 + emblemBonus);

// Get current emblem count
const currentEmblems = skillManager.getEmblems();
```

### Managing Permanent Skills

To upgrade a permanent skill with emblems:

```typescript
const skillManager = SkillStateManager.getInstance();

// Save the permanent skill level
skillManager.saveState(SkillType.EMBLEM_BONUS, 2, 2); // type, value, level
```

### Using Skill Levels in Game Logic

To use the permanent skill levels in gameplay:

```typescript
const skillManager = SkillStateManager.getInstance();

// Get a permanent skill level 
const emblemBonusLevel = skillManager.getSkillLevel(SkillType.EMBLEM_BONUS);

// Calculate value based on level
const emblemBonusValue = 1 + emblemBonusLevel;
```

## Testing Locally

For local testing, the system can work in mock mode:

```typescript
// Create a game server in mock mode
const server = GameServerFactory.createGameServer(true);

// Connect (no real server needed)
await server.connect("mock-telegram-id");
``` 