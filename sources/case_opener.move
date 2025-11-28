module case_opener::case_opener;

use std::string::{Self as string, String, utf8};
use sui::display::{Self as display, Display};
use sui::event;
use sui::package::{Self as package, Publisher};
use sui::random::{Random, new_generator, generate_u64_in_range};
use sui::tx_context::sender;
use sui::url::{Url, new_unsafe_from_bytes};

// Rarity tiers
const COMMON: u8 = 1;
const RARE: u8 = 2;
const EPIC: u8 = 3;
const LEGENDARY: u8 = 4;

public struct Case has key, store {
    id: UID,
}

public struct Skin has key, store {
    id: UID,
    name: String,
    description: String,
    url: Url,
    rarity: u8,
}

public struct SkinCreated has copy, drop {
    owner: address,
    skin_id: object::ID,
    rarity: u8,
}

/// One-Time Witness for this module (required for Publisher / Display)
public struct CASE_OPENER has drop {}

/// Permanently delete a Skin NFT the user owns.
public fun delete_skin(skin: Skin, _ctx: &mut TxContext) {
    let Skin { id, name, description, url, rarity } = skin;
    let _ = name;
    let _ = description;
    let _ = url;
    let _ = rarity;
    object::delete(id);
}

/// Mint a new loot case and send it to the sender
public fun create_case(ctx: &mut TxContext) {
    let case = Case { id: object::new(ctx) };
    transfer::transfer(case, sender(ctx));
}

/// Internal helper: choose name/description/url based on rarity
fun sort_rarity(rarity: u8): (String, String, Url) {
    let (name, description, url) = if (rarity == COMMON) {
        (
            b"Common Dagger",
            b"A trusty common dagger.",
            b"https://raw.githubusercontent.com/Tom-S-Hill/public_files/main/Common_item.png",
        )
    } else if (rarity == RARE) {
        (
            b"Rare Potion",
            b"A rare magic potion.",
            b"https://raw.githubusercontent.com/Tom-S-Hill/public_files/main/Rare_item.png",
        )
    } else if (rarity == EPIC) {
        (
            b"Epic Sword",
            b"An epic sword.",
            b"https://raw.githubusercontent.com/Tom-S-Hill/public_files/main/Epic_item.png",
        )
    } else {
        (
            b"Legendary Amulet",
            b"A legendary amulet forged in a volcano.",
            b"https://raw.githubusercontent.com/Tom-S-Hill/public_files/main/Legendary_item.png",
        )
    };

    let name_value = utf8(name);
    let description_value = utf8(description);
    let url_value = new_unsafe_from_bytes(url);

    (name_value, description_value, url_value)
}

/// Open a case using Sui randomness, mint a Skin NFT and send to opener
public fun open_case(c: Case, r: &Random, ctx: &mut TxContext) {
    // consume (destroy) the case
    let Case { id } = c;

    // randomness
    let mut gen = new_generator(r, ctx);
    let n = generate_u64_in_range(&mut gen, 0, 99);

    // rarity weights
    let rarity = if (n < 75) {
        COMMON
    } else if (n < 90) {
        RARE
    } else if (n < 99) {
        EPIC
    } else {
        LEGENDARY
    };

    // NFT metadata
    let (name, description, url_value) = sort_rarity(rarity);

    // build the Skin NFT
    let skin = Skin {
        id: object::new(ctx),
        name,
        description,
        url: url_value,
        rarity,
    };

    // event (simpler: just emit rarity as u8)
    event::emit(SkinCreated {
        owner: sender(ctx),
        skin_id: object::id(&skin),
        rarity,
    });

    // send skin to opener
    transfer::transfer(skin, sender(ctx));

    // delete the case (simulate it being opened)
    id.delete();
}

/// Runs automatically on package publish.
/// Creates a Display<Skin> so wallets (like Slush) know how to render it.
fun init(otw: CASE_OPENER, ctx: &mut TxContext) {
    // 1. Claim the Publisher for this package
    let publisher: Publisher = package::claim(otw, ctx);

    // 2. Build the field names and templates as Strings
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"link"),
        string::utf8(b"image_url"),
        string::utf8(b"description"),
        string::utf8(b"rarity"),
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{url}"), // link
        string::utf8(b"{url}"), // image_url
        string::utf8(b"{description}"),
        string::utf8(b"{rarity}"),
    ];

    // 3. Create Display<Skin> with those fields
    let mut d: Display<Skin> = display::new_with_fields<Skin>(
        &publisher,
        keys,
        values,
        ctx,
    );

    // 4. Commit first version of Display
    d.update_version();

    // 5. Transfer Publisher + Display to sender so you can later update them
    transfer::public_transfer(publisher, sender(ctx));
    transfer::public_transfer(d, sender(ctx));
}
