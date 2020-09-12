# Taro
<p align="center">
  <a href="https://modd.io">
    <img src="logo.png" width="400" alt="Taro Engine logo">
  </a>
</p>

## 2D multiplayer HTML5 game engine.
**[Taro Engine](https://www.modd.io) is a multi-player-first, cross-platform
game engine to launch 2D HTML5 game servers.** It can support up to 64 concurrent players hosted on a $5/month VM while running box2d physics.
Join us on [Discord](https://discord.gg/XRe8T7K) or support us on [Patreon](https://www.patreon.com/moddio)

## Demo ##
[Hunt and gather](https://beta.modd.io/play/huntandgather)

## What's included in the box
**Taro Engine is NOT designed for single player games.** 
Instead, it comes with a set of features that are ideal for casual multiplayer games including:
- Box2D Physics
- Netcode using UWS and LZ-string compression
- Inventory & item system
- Unit attributes (HP, Energy, etc)
- Weapon system (melee & projectile)
- Dialogue windows
- Shops
- Unit control (top-down WASD or platformer)
- Client-side predicted projectile + unit rotation
- Basic AI
- Ability to run multiple game server instances in one process
- Mobile controls
- and more!

## We need your help!
Netcode and performance optimizations are difficult problems to solve. While we have solved much of this already, we are always looking for more contributors to help us further optimize this game engine.
Taro is completely free and open source under GPLv3 license.

## How to run a game server
Taro engine will run a game made in [modd.io](https://www.modd.io) platform. To run the game, execute the following command:
```
npm run server --game=<gameID>
```
*if the gameID argument is not provided, then the engine will use game.json stored in root directory
Your game's Game ID can be found in your modd.io's game's sandbox. Go to menu -> about.

## Connecting to the game server
Visit http://localhost:2000 to start testing game.

## How to customize game client UI
Game client's user interface is rendered using /template/index.html file. Feel free to edit it for your needs

## How to make games on modd.io
Please visit https://www.modd.io/tutorials for more information

## Extra information
Before being open sourced in September 2020, Taro Engine was originally forked from [Isogenic Game Engine](https://www.isogenicengine.com/) back in 2016
