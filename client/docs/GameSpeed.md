# Game Speed Feature Documentation

## Overview
The Game Speed feature allows players to increase the overall speed of gameplay. It affects all game actions such as enemy movement, projectile speed, attack rates, and spawn intervals, making the game faster and reducing monotony during extended play sessions.

## Implementation Details

### Skill Definition
- The Game Speed skill (`GAME_SPEED`) is defined in the `SkillType` enum
- Base speed multiplier is 1.0 (normal speed)
- Each upgrade increases the multiplier by 0.25
- Maximum multiplier is 3.0 (3x normal speed)

### Components Affected
The game speed multiplier affects the following game aspects:

1. **Delta Time**: In GameScene.update(), the delta time is multiplied by the game speed, affecting all time-based updates
2. **Projectiles**: 
   - Projectile movement speed is multiplied by the game speed
   - Fire rate is divided by the game speed (lower interval = faster firing)
3. **Enemies**:
   - Enemy movement speed is multiplied by the game speed
   - Enemy spawn interval is divided by the game speed
4. **Timers**: All game timers should respect the game speed multiplier

### Getting the Game Speed Multiplier
The current game speed multiplier can be accessed through:
```typescript
const speedMultiplier = SkillStateManager.getInstance().getGameSpeed();
```

### Events
When the Game Speed skill is upgraded, a `gameSpeedChanged` event is emitted with the new speed multiplier value:
```typescript
gameScene.events.emit('gameSpeedChanged', newSpeedValue);
```
Components can listen for this event to update their behaviors accordingly.

## User Interface
The Game Speed upgrade is available in the Utility Upgrades category. The UI displays:
- Current level
- Effect (speed multiplier)
- Cost for the next upgrade

## Balance Considerations
Since the Game Speed feature affects all aspects of gameplay, it should not create any imbalance between offensive and defensive elements. Both enemies and player projectiles move faster, maintaining the same relative challenge.

## Future Enhancements
Potential enhancements for this feature:
- Visual indicator of current game speed
- Ability to toggle between speed levels without purchasing upgrades
- Slow-motion effects for dramatic moments 