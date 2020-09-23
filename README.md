<p align="center">
  <a href="https://modd.io">
    <img src="logo.png" width="400" alt="Taro Engine logo">
  </a>
</p>

## 2D HTML5 Multiplayer Game Engine.
**Taro is a multi-player-first, cross-platform 2D HTML5 game engine.** 
It can support up to 64 concurrent players hosted on a $5/month VM while running box2d physics.
Join us on [Discord](https://discord.gg/XRe8T7K) or support us on [Patreon](https://www.patreon.com/moddio)

## Demo ##
[Taro Town](http://taro.town)

<img src="./assets/images/demo.png" width="390" alt="demo">

## What's included in the box
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

## How to run a game server
Taro engine will run games made using [modd.io](https://www.modd.io).

To run the game server, execute the following command:
```
npm run server --game=<gameID>
```
*if the gameID argument is not provided, then the engine will use game.json stored in root directory instead.

Your game's Game ID can be found in your modd.io's game's sandbox ([example](https://beta.modd.io/sandbox/game/two-houses/scripts)). Go to menu -> about.

<img src="./assets/images/gameid.png" width="600" alt="How to get game id">

## Connecting to the game server
Visit http://localhost:2000 to start testing game.

## How to customize game client UI
Game client's user interface is rendered by [/src/index.ejs](https://github.com/moddio/taro/blob/master/src/index.ejs) file and the theme files in [/src/templates/](https://github.com/moddio/taro/tree/master/src/templates)

## How to make games on modd.io
Please visit https://www.modd.io/tutorials for more information

## We need contributors! Also, we are hiring
Taro is completely free and open source under MIT license.

Netcode and performance optimizations are difficult problems to solve. While we have solved much of this already, we are always looking for more contributors to help us further optimize this game engine. To be a contributor, please contact m0dE in our [Discord](https://discord.gg/XRe8T7K)

If you find yourself enjoying making contributions, let's talk about working together.


Before being open sourced in September 2020, Taro Engine was originally forked from [Isogenic Game Engine](https://www.isogenicengine.com/) back in 2016
