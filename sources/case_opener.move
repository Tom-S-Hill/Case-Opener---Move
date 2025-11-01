module case_opener::case_opener;

use std::vector;
use sui::object::{Self, UID};
use sui::random::{Random, RandomGenerator, new_generator, generate_u64_in_range};
use sui::transfer;
use sui::tx_context::{TxContext, sender};

/// Simple CSGO-style loot case experiment on Sui.
/// Not production-ready — just testing randomness and object creation

/// Rarity tiers (could be expanded later)
const COMMON: u8 = 1;
const RARE: u8 = 2;
const EPIC: u8 = 3;
const LEGENDARY: u8 = 4;

/// A loot case that can be opened by the user
public struct Case has key, store {
    id: UID,
}

/// Skin (the reward item you get)
public struct Skin has key, store {
    id: UID,
    rarity: u8,
    name: vector<u8>,
}

/// Mint a new loot case and send it to the transaction sender
public entry fun create_case(ctx: &mut TxContext) {
    let case = Case { id: object::new(ctx) };
    transfer::transfer(case, sender(ctx));
}

/// Open a case using secure randomness from Sui validators.
///
/// `c`: the Case being opened (must own it)
/// - `rnd`: shared randomness object from validators
/// - `ctx`: transaction context
public entry fun open_case(c: Case, rnd: &Random, ctx: &mut TxContext) {
    // consume (destroy) the Case
    let Case { id } = c;

    // new random generator
    let mut gen = new_generator(rnd, ctx);

    // roll number between 0–99 for rarity
    let n = generate_u64_in_range(&mut gen, 0, 100);

    // rarity weights (tweak later if needed)
    let rarity = if (n < 70) {
        COMMON
    } else if (n < 90) {
        RARE
    } else if (n < 98) {
        EPIC
    } else {
        LEGENDARY
    };

    // random-ish name label (could map to NFT metadata later)
    let name = if (rarity == COMMON) {
        b"Common USP-S"
    } else if (rarity == RARE) {
        b"Rare AK-47"
    } else if (rarity == EPIC) {
        b"Epic AWP"
    } else {
        b"Legendary Knife"
    };

    // create the skin reward
    let skin = Skin {
        id: object::new(ctx),
        rarity,
        name,
    };

    // give it to the player
    transfer::transfer(skin, sender(ctx));

    // delete the case (simulate it being opened)
    id.delete();

    // TODO: maybe add case types or animation seed later
}
