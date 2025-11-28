# Sui Case Opener

A small learning project built in **Move** on the **Sui blockchain**, inspired by CSGO-style loot cases.  
The goal is to simulate opening a case on-chain using **Sui’s secure randomness** to decide which skin (item) the player receives.

---

## Features

- Uses Sui’s built-in `Random` module for fair, on-chain randomness  
- Simple rarity tiers: Common, Rare, Epic, Legendary  
- Transferable objects — each reward is owned by the caller  
- Designed to learn how Move handles ownership and secure randomness

---

## How It Works

1. **Create a case**
   ```move
   create_case(ctx)
   ```
   Mints a new Case object for the caller.

2. **Open a case**

  ```move
  open_case(case, rnd, ctx)
  ```
- Consumes the Case object
- Generates a random rarity and name
- Mints and transfers a new Skin object to the caller

## Rarity Distribution
| Rarity	| Chance	| Example Item |
| ------ | --- | ------------ |
| Common	| 75%	| "Common Dagger" |
| Rare | 15%	| "Rare Potion" |
| Epic	| 9%	| "Epic Sword" |
| Legendary	| 1%	| "Legendary Amulet" |

### About

This project is part of my learning journey while preparing for the Comets of Web3 x Sui Foundation Bootcamp (Dec 2025).
It helped me understand object ownership, randomness, and secure contract design in Move.

#### Author

Thomas Hill
