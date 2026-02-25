**\_**!!! INCOMPLETE !!!**\_**

# Document Information

Written by:

- mindedness

Last information update/review: Unstable 0.12.6.2

# Table of Contents

## Terminology

- [Game Tick (also known as tick)](#game-tick)
- [Gdata - Game Data](#gdata-game-data)
- [Regex - Regular Expression](#regex-regular-expression)
- [Wearables - Equipment](#wearables-equipment)

## Properties

- [Common Properties](#common-properties)
- [Category-Specific Properties](#category-specific-properties)

## Categories

- [Resources](#resources)
- [Armors](#armors)
- [Classes](#classes)
- [Dungeons](#dungeons)
- [Enchants](#enchants)
- [Encounters](#encounters)
- [Events](#events)
- [Furniture](#furniture)
- [Homes](#homes)
- [Locales](#locales)
- [Materials](#materials)
- [Monsters](#monsters)
- [Player](#player)
- [Potions](#potions)
- [Properties](#properties)
- [Rares](#rares)
- [Reagents](#reagents)
- [Sections](#sections)
- [Skills](#skills)
- [Spells](#spells)
- [States](#states)
- [Stressors](#stressors)
- [Tags (Category)](#tags-category)
- [Tasks](#tasks)
- [Upgrades](#upgrades)
- [Weapons](#weapons)
- [Quests](#quests)
- [Clashes](#clashes)
- [Equipslots](#equipslots)
- [Potencies](#potencies)
- [Hall](#hall)
- [Glossaryentries](#glossaryentries)
- [Professions](#professions)
- [Places](#places)

## Related Information

- [Mod Properties](#mod-properties)
- [Reference Objects](#reference-objects)
- [JS String Syntax](#js-string-syntax)

## Other

- [Deprecated items](#deprecated-items)
- [Future items](#future)

# Terminology

## Game Tick

Game tick (also known as tick) is the minimum time the game waits before doing another game update, normally measured in milliseconds.
In arcanum, the game tick is 120ms (located in [game.js, line 29](../src/game.js#L29)).

**Note**: Game tick and time difference between game updates can differ. Time difference is capped between 0s and 1s.

## Gdata - Game Data

Gdata refers to any data item (such as weapons, monsters, and stats) that are added into the game via data modules.
Note: The usage of gdata within the documentation differs from the [gdata class](../src/items/gdata.js), as not all data items are defined as Gdata, such as [TagSets](../src/composites/tagset.js).

## Regex - Regular Expression

Short Version: A special string used for matching patterns in other strings.
Some useful sites for learning and working with regular expressions:

- [Wikipedia](https://en.wikipedia.org/wiki/Regular_expression) - Has a lot of information about regex.
- [Regex101](https://regex101.com/) - Has tools for working, testing, and explaining regex.
- [Regexr](https://regexr.com/) - Another website with tools for working, testing, and explaining regex.

For more information about regex, look it up on Google.

**Note**: As Arcanum runs on Javascript, be aware that there may be some slight differences in handling versus regex used in other coding languages.

## Wearables - Equipment

Wearables is what the equipment class is called in the code for Arcanum.

# Properties

List of general properties used within each category, and general description for each one.  
Certain properties will differ in usage, or may be for a specific category.
If so, the property will be listed under that particular category as well.

## Id

Type: String

Format:

- Must have no periods.
- Should only contain alphanumeric, hyphen, or underscore characters.
- If it is derived from the name, spaces should be replaced with underscore.

Other important notes:

- Required
- Must be unique

Used to uniquely identify any item within the game.  
Must be unique, otherwise an item may overwrite another item or may be overwritten by another item.

## Name

Type: String

Display name for an item.  
If an item does not have a `name` property, [`id`](#id) is typically used instead.

## Desc

Type: String

Provides useful information about an item, or describes an item.  
Displayed in the popup tooltip of items like [tasks](#tasks) or [resources](#resources).  
Otherwise, unused for those that do not have tooltips.

## Flavor

Type: String

An item descriptor meant for humerus dialogue related to item.  
May contain easter eggs, inside jokes, references, memes, or even insight to how unfunny the module's writer was.  
Displayed in the popup tooltip of items like [tasks](#tasks) or [resources](#resources).  
Otherwise, unused for those that do not have tooltips.

## Require

Type: String

Format: Must follow one of the following

- Exact id of another item
- [JS syntax](#js-string-syntax), using [g](#game), [i](#item), and [s](#state) as parameters

The `require` property is used to define when an item can show up, or can be displayed.  
When `require` matches the id of an item, it checks if the referenced item listed is unlocked to determine when the item itself should unlock.  
If the game cannot match the syntax to any game item, the game assumes that `require` is using [JS syntax](#js-string-syntax), turns `require` into a function, and runs the function during game tick updates.  
Result of the function is treated as a boolean.  
The `require` property is only checked until it is fulfilled; once fulfilled, the item stays unlocked, even if the condition becomes false later on.

Note: If `require` does not reference a game item id while being a function, it may not be called.  
Game parses `require` function strings to check for item ids so that it can be added to a list to check against items updated each game tick, so that it doesn't have to check all `require` functions every game update, but also means it may not check the ones that don't use item ids.

## Mod

Type: Object (`<String, Number>`, `<String, String>` or `<String, Object>`)

Format:

- Key-value pairs must have an item id as the key with one of the following values:
    - a number
    - an object
    - a [mod string](#mod-strings)
- If the value is an object:
    - the key should be one of the following possible properties on the referenced game data or object:
        - one of the [mod properties](#mod-properties)
        - one of the [stat properties](#stat-properties)
        - an object property with a value that follows the same pattern
        - a property that can be turned into one of the options listed above (explained further in [mod properties](#mod-properties))
    - nested property values should eventually result in a number or [mod string](#mod-string) value.

A `mod` property holds information on how an item modifies other items based on its own value and the mod's multipliers.  
For more information about how Mods are handled in the game, see [mod properties](#mod-properties)

## Level

TODO incomplete.  
Type: Number

`level` has a various different uses depending on what category it is used in.  
In a majority of the use cases, `level` is used to calculate default values for certain undefined properties.

Non-exhaustive list of use cases:

- Used to indicate how much space it takes up in relevant cases.
- Adventures use `level` to determine the length of an adventure when [length](#length) isn't specified.
- When [spawns](#spawns) isn't specified, `level` determines what spawns in an adventure
- loot
- skill xp
- monster base stats
- monster purchasing
- spell arcana cost
- dot level via source
- npc stats (dodge)
- npc purchase cost
- wearable's level upon reviving (through the template's & material's level)
- how much spell list capacity a spell takes
- loot from monster with general loot table
- material and wearable generation for general loot
- sell price (5 \* level)
- dot comparison for replacement or extension
- how much enchant capacity a given enchant takes up on an item.

## Cost

Type: Number or Object (`<String, Number>`, `<String, String>` or `<String, Object>`)

Format:

- Any numbers should be non-negative.
- Objects must be [reference objects](#reference-objects).

`cost` is the cost tied to acquiring an instance of a game item.  
When `cost` is a number, it is used as the gold cost for an item.  
Should not be confused with [buy](#buy), as `buy` is a one time cost to be able to use the item, and the item is not used when `buy` is paid, whereas `cost` is paid every time an item is used.  
`cost` is paid _before_ using an item, and used items that rely on value would apply changes next game update.

## Tags (Property)

Type: String or Array (`<String>`)

Format:

- Tags listed must refer to a [TagSet](#tagset), or, in the case that a new tag is begin defined in `tags`, it must adhere to [id](#id) restrictions.
- Strings with multiple tags must be seperated by "," with no spaces.

The `tags` property is to label an item in order to group items with the same tags.  
`tags` are special in that if any [Tagset](#tagset) they are referring to isn't in the game, the game will generate that Tagset automatically.  
This means that the tag doesn't have to be defined in the [tags category](<#tags-(category)>) in order to be added in-game (though they will be given default values).  
Any tag created from the `tags` property with the "t\_" prefix will have the prefix removed in their `name` property (but remains unchanged in the `id` property).

## Result

Type: String, Array (`<String>` or `<Object>`), or Object (`<String, Number>`, `<String, Boolean>`, or `<String, Object>`)

Format:

- String values must match the id of non-item gdata class object.
- Objects must be [reference objects](#reference-objects).

## Max

## Effect

## Alias

## Buy

## Locked

## Need

## Only

## Kind

## Log

## Loot

## Run

## Slot

## Attack (Property)

## Disable

## Enchants

## Length

## Repeat

## Actname

## Adj

## Alter

## Hide

## Lock

## School

## Title

## Tohit

## Verb

## Armor

## At

## Biome

## Cd

## Dist

## Hands

## Noproc

## PriceMod

## Properties

## Rate

## Reverse

## Sell

## Start

## Sym

## Unique

## Unit

## Unused

## Warn

## Actdesc

## Action

## Bars

## Bonus

## Boss

## Buyname

## Choice

## Color

## Craftable

## Damage

## Defense

## Distance

## Dodge

## Dot

## Duration

## Encs

## Every

## Evil

## Evilamt

## Exclude

## Fill

## Flags

## Group

## Hp

## Immune

## Material

## Owned

## Perpetual

## Reflect

## Regen

## Resist

## Runmod

## Scale

## Secret

## Silent

## Spawns

## Speed

## Spells

## Stat

## Type

## Unlock

## Use

## Val

## Weight

# Categories

## Armors

## Classes

## Dungeons

## Enchants

## Encounters

## Events

## Furniture

## Homes

## Locales

## Materials

## Monsters

## Player

## Potions

## Properties

## Rares

## Reagents

## Resources

## Sections

## Skills

## Spells

## States

## Stats

## Stressors

## Tags (Category)

Tagsets are listed under tags.  
They are not necessary to declare, as tags will be generated automatically once listed in [tags](<#tags-(property)>), but are used to apply additional properties.

They currently use only [id](#id) and [name](#name) from general properties.

### Hide

Type: Boolean
Default Value: False

Determines if the tag is shown in an item's popup window under tags.

## Tasks

## Upgrades

## Weapons

# Related and Relevant Information

## Stat Properties

In Arcanum, a Stat is an object that represents a number.  
One of the big reasons for having a Stat in the place of a number is so that the value can be modded and unmodded.  
Stats are automatically generated in one of the cases where a mod targets a undefined or numeric value.

## Mod Properties

Mods are extensions of Stats, meaning mods themselves are also moddable, and have a value, which is used for modifying its target.
In addition, Mods have a property called `count`, which dictates how many times the mod is applied.
In most cases, `count` refers to it's source's value.
Some exceptions to this:

- [Wearables](#wearables---equipment), which does use the source's value, but the source's value is dictated by whether or not it is equipped, and is never more than 1 if so.
- All mods listed under the [`runmod` property](#runmod), as those are set to 1, and only while the task that applies it is running.

Whenever a mod is being applied, it does the following:

- If the target property is undefined, but

Currently, mods are intended to only originate from an item, and can only use an item's value property as the initial source (and not other properties, like max or rate), so mods on inner non-mod properties may not work as intended.

## Mod Strings

Mod Strings follow one of 4 formats:

### Regular Mod

[Mod Regex](..\src\values\mods\mod.js#L10)  
Rough Format: `(Flat)+(Percent)%`

The regular mod applies both a flat and percent modifier onto its target.  
The number of times it is applied is equal to the count.  
`Flat` and `Percent` are decimal values, with Percent having a % suffix to denote that it is a percent increase.  
At least one of the two values need to be present within the mod string in order for the string to be properly parsed as a mod.  
If both are present, the sign for a positive percent decimal is required.

### Atmod

[Mod Regex](..\src\values\mods\atmod.js#L4)  
Rough Format: `(Operator)(Value)?(Flat)`

The Atmod applies a mod of `Flat` as long as it's numeric comparison is met.  
The comparison refers to the `Operator` and `Value`.
`Operator` must be one of the following values: `>`, `>=`, `<`, `<=`, `=`.  
`Value` is the value that the count is compared to using the`Operator` as the comparator.  
`Flat` is a decimal value. There must be no sign if the value is positive.  
If the comparison is met, the `Flat` modifier is applied to the target once.  
Otherwise, the mod is applied zero times.

The `?` is mandatory in order for a string to be recognized as an Atmod.  
If `Operator` is missing, it defaults to the "greater than or equal to" value (>=).  
If `Value` is missing, it defaults to 1.  
If `Flat` is missing, it defaults to 0.

### Permod

[Mod Regex](..\src\values\mods\permod.js#L4)  
Rough Format: `(Flat):(Per)`

The Permod applies a flat mod up to the number of times the count is divisible by `Per` (rounded down).  
Both `Flat` and `Per` are decimal numbers. `Per` must be greater than 0 and `Flat` must be 0 or greater.  
The `:` is mandatory for a string to be recognized as a Permod.  
Both have a default value of 1 if unspecified.

### Rangedmod

[Mod Regex](..\src\values\mods\rangedmod.js#L18)
Rough Format: `(Regular Mod)/(Min OP)(Min)/(Max)/(Mode)(Rounding)(Step)`

The Rangedmod applies a [regular mod](#regular-mod) based on the count and a range.

With default behaviors, the regular mod is applied a minimum times of `Min`, and up to a maximum defined by `Max`.  
If `Min` is undefined, it is treated as 0, and if max is undefined, then the mod can be applied up to the number maximum.

If `Min OP` is defined, it changes the behavior of the minimum so that, if the comparison using the comparator defined by `Min OP` isn`t met, the mod is applied 0 times instead.  
The possible values of `Min OP`are`>`and`>=`.

`Step` defines where the count should be rounded to (starting at `Min`), and `Rounding` defines what operation is used.  
If `Step` isn't defined, the count isn't rounded.  
`Rounding` can be one of the following: `+` for ceil, `-` for floor, or undefined for round.  
If `Mode` is defined (with the character `~`), then, instead of rounding to the nearest `Step`, it divides the range between `Min` and `Max` in `Step` plus one sections, and rounds the count to the nearest one.  
In order for `Mode` to work, `Max` and `Step` must be defined. `Min` is treated as zero if it is not defined.

## Reference Objects

A reference object is an object that describes what specific gdata properties (or nested properties) are affected and by how much.

Reference objects have the following format:

- The outermost keys must refer to the id of a gdata item (will now be referred to as target) stored in the game.
- Nested reference objects' keys must be known properties of the targetted object referred to in the parent reference object.
- Unless stated otherwise, the related value for any key must result in a nested reference object, a number, or a [function string](#js-string-syntax) that results in a number, using [g](#game), [a](#actor), and [c](#context) parameters.

## JS String Syntax

A Javascript string is a string that is parsed into a function that is used in the game. It is important that it follows Javascript syntax (otherwise it will produce errors) and is a single line of code that produces some sort of result, depending on what it is being used for. This is how a portion of the tricks that goes on in arcanum can be done. Specific parameters are passed into the function upon being called, depending on what the function is being used for.

### Game

Game (g) is the entire list of gdata items recorded in the game. Does not include any of the game functions.

### Target

Target (t) is the target that will be affected by the result of the function. Passed in parameter is an NPC or player. Used for attacks and effects.

### Actor

Actor (a) is the source of the function call. Passed-in parameter is an NPC or player. Used for everything except boolean tests.

### Item

Item (i) is the source item that contains the function being evaluated. Used primarily in damage calculations and potency scaling. In damage functions (created via `MakeDmgFunc`), Item (i) is set to the attack source (`attack.source`). In potency damage calculations, Item (i) is set to the potency stat itself, allowing the potency's `damage` function to access the potency's properties (like `i.value`).

### Context

Context (c) refers to the target's context, and is used only in attacks.

### State

State (s) is the gdata manager (normally the GameState), with all of the functions and properties included. Used specifically for test functions.

# Properties

List of general properties used within each category, and general description for each one.
Certain properties will differ in usage, or may be for a specific category.
If so, the property will be listed under that particular category as well.

## Common Properties

These properties are used across multiple categories. See the table above for which categories use each property.

## Id

Type: String

Format:

- Required
- Must be unique
- Must have no periods and only contain alphanumeric, hyphen, or underscore characters.
- If it is derived from the name, spaces should be replaced with underscore.
- The prefix of 'untag\_' is reserved. Do not use this for object Ids.

Used to uniquely identify any item within the game.
Must be unique, otherwise an item may overwrite another item or may be overwritten by another item.

**Note on Property Values**: Properties of Items can be set to `null`, but should not be deleted. If a property is deleted from saved data, it will be restored by default values on reload. Use `null` to explicitly disable a property rather than omitting it.

## Name

Type: String

Display name for an item.
If an item does not have a `name` property, [id](#id) is typically used instead.

## Desc

Type: String

Provides useful information about an item, or describes an item.
Displayed in the pop-up tooltip of items like [tasks](#tasks) or [resources](#resources).
Otherwise, unused for those that do not have tooltips.

## Flavor

Type: String

An item descriptor meant for humerus dialogue related to item.
May contain easter eggs, inside jokes, references, memes, or even insight to how unfunny the module's writer was.
Displayed in the pop-up tooltip of items like [tasks](#tasks) or [resources](#resources).
Otherwise, unused for those that do not have tooltips.

## Require

Type: String

Format: Must follow one of the following

- Exact id of another item
- [JS syntax](#js-string-syntax), using [g](#game), [i](#item), and [s](#state) as passed in object variables.

The `require` property defines when an item can initially unlock. When `require` matches the id of an item, the game checks if that referenced item is unlocked to determine when the item itself should unlock. If the game cannot match the syntax to any game item, it assumes that `require` is using [JS syntax](#js-string-syntax), converts `require` into a function, and runs the function during game tick updates. The result of the function is treated as a boolean.

The `require` property is only checked until it is fulfilled. Once fulfilled, the item stays unlocked (`locked = false`), even if the condition later becomes false.

**Note**: `require` is NOT checked for usability (`canUse()`/`canRun()`) - it only affects initial unlocking. For ongoing usability requirements, use [need](#need) instead.

If `require` is not specified, the game will use `need` as a fallback for initial unlocking via `tryUnlock()` (the code uses `require || need`). This means items with only `need` (but no `require`) will unlock automatically when `need` is met.

**Note**: If `require` is a function string that does not reference any game item ids, it may not be called. The game parses `require` function strings to check for item ids so that it can add them to a list to check against items updated each game tick. This optimization means the game doesn't have to check all `require` functions every game update, but also means functions that don't use item ids may not be checked.

## Mod

Type: Object (`<String, Number>`, `<String, String>` or `<String, Object>`)

Format:

- Key-value pairs must have an item id as the key with one of the following values:
    - a number
    - an object
    - a [mod string](#mod-strings)
- If the value is an object:
    - the key should be one of the following possible properties on the referenced game data:
        - one of the [mod properties](#mod-properties).
        - one of the [stat properties](#stat-properties).
        - an object property with a value that follows the same pattern.
    - nested property values should eventually result in a number or [mod string](#mod-string) value.

A `mod` property holds information on how an item modifies other items based on its own value and the mod's multipliers.

Mods are applied per-quantity based on the item's `value` property and persist as long as the item has value > 0. For tasks, mods persist regardless of whether the task is running or not. For dots, mods are applied when the dot is added and removed when the dot expires (see [dot mod behavior](#dot-object-properties)).

## Level

Type: Number

`level` has various different uses depending on what category it is used in.
In a majority of the use cases, `level` is used to calculate default values for certain undefined properties.

**Common uses by category:**

- **Locales/Dungeons**: Used to determine the length of an adventure when [length](#length) (see [Tasks](#tasks)) isn't specified. When [spawns](#spawns) (see [Locales](#locales)) isn't specified, `level` determines what spawns in an adventure. Also affects distance requirements.
- **Monsters**: Determines base stats (HP, damage, defense) when not explicitly defined. Affects loot generation from general loot tables. Used for monster purchasing costs.
- **Spells**: Determines arcana cost when not specified. Used for spell power scaling.
- **Skills**: Used to calculate skill experience requirements and progression.
- **Rares/Equipment**: Determines the item's power level. Affects sell price (5 \* level). Used for wearable's level upon reviving (through the template's & material's level). Affects material and wearable generation for general loot.
- **Enchants**: Used for enchant max reduction upon applying enchant.
- **Dots**: Used for dot level comparison for replacement or extension.
- **NPCs**: Affects NPC stats like dodge. Used for NPC purchase cost calculations.

## Cost

Type: Number or Object (`<String, Number>`, `<String, String>` or `<String, Object>`)

Format:

- Any numbers should be non-negative.
- Objects must be [reference objects](#reference-objects)
- An object's key-value pairs must have an item id as the key with the value being one of the following:
    - a number
    - a [function string](#js-string-syntax) using [g](#game), [a](#actor), and [c](#context)
    - an object
- For nested objects,
    - A key must be a known property of the GData/property that is used as the object's key pair in it's parent object.
    - The value's type must follow the same pattern stated above.
    - Nested objects must eventually end with the key referring to a numeric or [stat](#stat) property, with the value being either a number or a [function string](#js-string-syntax) as listed above.

`cost` is a one-time price to cast a spell, perform an action, or start a continuous action.
When `cost` is a number, it is used as the gold cost for an item.

Should not be confused with [buy](#buy), as `buy` is a one time cost to be able to use the item, and the item is not used when `buy` is paid, whereas `cost` is paid every time an item is used.
`cost` is paid _before_ using an item, and used items that rely on value would apply changes next game update.

## Buy

Type: Object

Format: Same as [cost](#cost).

A one-time price to own or learn an item.

Once `buy` is paid, the item becomes available for use or purchase.
The `buy` cost is never applied more than once. Once bought, normal `cost` and `run` fees still apply if they are defined.

Distinct from [cost](#cost), which is paid each time the item is used.
Commonly used for skills, spells, potions, enchants, and mounts that need to be learned before use.

## Need

Type: String

Format: Same as [require](#require).

Similar to [require](#require), but `need` serves dual purposes:

- It can be used for initial unlocking via `tryUnlock()` when `require` is not specified (the code uses `require || need` as a fallback), and
- It is checked continuously for usability in `canUse()` and `canRun()` methods. If `need` becomes false after being true, the item may become unavailable again (cannot be used/run), even if it was previously unlocked.

**Key differences from `require`**: `need` affects usability - items with unmet `need` conditions cannot be used even if unlocked, `need` is checked every time `canUse()` or `canRun()` is called, and items with only `need` (no `require`) will unlock automatically when `need` is met via the `require || need` fallback in `tryUnlock()`. Used for items that have ongoing requirements that must be maintained to remain usable.

## Dot

Type: Object

Format:

- Can contain `duration` (number, in seconds). Must be a positive number. If `duration` is `0`, `null`, `undefined`, or omitted, the dot becomes permanent (`perm: true`).
- Can contain `effect` (object, stat/mood changes), `damage` (damage over time), `mod` (modifiers), `healing` (healing over time), or `id` (string, unique identifier).

Defines a damage-over-time, effect-over-time, or healing-over-time effect. Used in spells, potions, and monster attacks to create ongoing effects. Each `dot` needs a unique `id` to prevent conflicts with other dot effects.

## Hide

Type: Boolean

Default Value: false

If `true`, hides the item from normal UI display.
Used for items that should exist in the game state but not be visible to players (e.g. internal tracking items).

## Alias

Type: String

A backwards compatibility identifier for renamed items.
When an item's `id` is changed, the old `id` can be specified as an `alias` to maintain compatibility with existing save files.
The game will automatically migrate items using the alias to the new `id` when loading saves.

## Sym

Type: String

A display symbol or emoji used in the UI to represent the item.
Commonly used for locales, dungeons, and modules to provide visual identification.
Should be a single emoji or short symbol string.

### Some examples

- **🦴** (bones) - Dungeon difficulty prior to Tier 1. One bone to three bones in increasing difficulty.
- **💀** (skull) - Dungeon difficulty post Tier 1. One skull to six skulls in increasing difficulty with each skull representing a minimum tier level, for example six skulls in a Tier 6 difficulty.
- **🌳** (tree) - Locales
- **📖** (open book) - Locales
- **⚔💀** (crossed sword + skull) - Clashes (sometimes prefixed with a domain-specific emoji such as 🎃⚔💀 for Halloween clashes)

### Seasonal and module symbols

Seasonal and module symbols are added to relevant seasonal and module content, e.g., hall content, clashes, etc.

- **🎃** (pumpkin) - Halloween content
- **❄️** (snowflake) - Winter content
- **🌼** (flower) - Spring content
- **⌛️** (hourglass) - Timerip module

### Hall

- **🏰** (castle) - Hall-related content
- **🛠️🏰** (hammer and spanner) + (castle) - Hall glossary entries
- **🏰☸️** - Hall + Lexomancer
- **🏰❄️** - Hall + Winter seasonal
- **🏰🎃** - Hall + Halloween seasonal

### Glossary Entries

- **🛠️** (hammer and spanner) - Glossary entry explains a game mechanic. Sometimes suffixed with another emoji, for example 🛠️🔥 for Pyromancy-related glossary items.
- **📚** (book stack) - Glossary entry is a lore dump

### States

Various emojis used for state effects.

- **🚫** (prohibited) - Paralyze state
- **🚷** (no pedestrians) - Entangle state
- **😶** (face without mouth) - Silence state
- **😳** (flushed face) - Charmed state
- **🤪** (zany face) - Confused state

### Others

- **⚔️** (crossed swords) - Combat tutorial

## SortOrder

Type: Number

Determines the order in which items appear in UI lists.
Lower numbers appear first.
Used for organizing items within categories (spells, dungeons, equipslots, etc.).

## Locked

Type: Boolean

Default Value: true (for most items)

The initial locked state of the item when the game starts.
If `true`, the item starts locked and must be unlocked via `require` or other unlock conditions.
If `false`, the item is available from the start.
Can be overridden by unlock conditions.

## Title

Type: String

A title that can be awarded to the player when included in a `result` object.
When `result` contains `"title": "Title Name"`, the player receives that title.
Titles are displayed in the player's profile and may have gameplay effects.

## Tags (Property)

Type: String or Array (`<String>`)

Format:

- Strings with multiple tags must be separated by "," with no spaces.

The `tags` property is to label an item in order to group items with the same tags.

Any tag created from the `tags` property with the "t\_" prefix will have the prefix removed in their `name` property (but remains unchanged in the `id` property).

## Result

Type: String, Array (`<String>` or `<Object>`), or Object (`<String, Number>`, `<String, Boolean>`, or `<String, Object>`)

Format:

- String values refer to item ids that are unlocked or triggered when the result occurs.
- Object values must be [reference objects](#reference-objects) that specify what resources, items, or effects are granted.
- Boolean values (typically `true`) are used to trigger events or unlock items by id.

The `result` property defines what happens when an item completes or is successfully used.

`result` is applied once at the end of a Runnable action.

For tasks, encounters, locales, and dungeons, `result` applies when the activity completes (via `amount()` being called).

For spells and other items, `result` applies when the item is successfully used.

Resources granted through `result` are added immediately upon completion.

Events triggered via `result` (using `"evt_id": true` format) are unlocked and may trigger their own effects.

## Effect

Type: Object (`<String, Number>` or `<String, String>`)

Format:

- Key-value pairs must have an item id or stat property as the key.
- Values can be numbers, ranges (e.g., `"1~3"`), or [function strings](#js-string-syntax).

The `effect` property defines immediate changes that occur when an item is used or an encounter is triggered.

Effects are applied once and are not reversible.

During Runnable actions and Dots, effects are applied per-frame and multiplied by the elapsed frame-time (`dt`).

In dots and runnable actions, effects are applied continuously over the duration.
Effects can modify resources, stats, mood values, or other game properties.
For temporary effects that should persist over time, use [dot](#dot) instead.

## Loot

Type: Object (`<String, Number>`, `<String, String>`, or `<String, Object>`)

Format:

- Key-value pairs must have an item id as the key.
- Values can be numbers, ranges (e.g., `"2~5"`), percentages (e.g., `"25%"`), or [function strings](#js-string-syntax).

The `loot` property defines resources and items that can be obtained from monsters, dungeons, or encounters.
Loot is rolled when the monster is defeated or the encounter completes.
Percentages indicate a chance to receive the item, while numbers indicate guaranteed amounts or ranges.
When loot is obtained, it produces a message/notification to the player.

**Note**: The main differences from [result](#result): `loot` produces a message when items are obtained and is used for physical items/resources that can be "dropped". You typically don't want to drop things like skill exp as loot (use `result` for that), but the real big differences come up in the deprecated gear dropping mechanism. Both can contain resources, but `loot` is more for random/probabilistic drops while `result` is for guaranteed completion rewards.

## Convert

Type: Object (`<String, Object>`)

Format:

- Must be an object containing `input` and `output` properties
- Can optionally contain `singular` property (boolean)

Convert comes in 2 parts, "Input" and "Output", the convert property itself serves as a container for them and does nothing.

### Input

Format: same as [Cost](#cost)

Input values are deducted every game tick, scaled by ticks elapsed, as long as [Output](#Output).effect has things to fill OR if Output.mod is present.
If a convert property is present, the Input section is mandatory.

### Output

Divided into Output.effect and Output.mod
Format: same as [Effect](#effect)
Format: same as [Mod](#mod)

Output.effect works the same as Effect definition, but only if the Input was paid. Output.effect does nothing if all listed items are full.

Output.mod works the same as Mod definition, except applying modifiers to it is not currently supported and it only provides the alterations if Input is paid. If input is not paid, the modifications are removed until it can be paid again.
If a convert property is present, the Output section is mandatory.

### Singular

Type: Boolean

Default Value: false

If `true`, the conversion uses fixed amounts instead of scaling by the furniture's value or elapsed time.
When `singular` is `true`, input costs and output effects are calculated as if the furniture has a value of 1, regardless of how many units are actually owned.
When `false` (default), input costs and output effects scale with the furniture's `value` property and elapsed time (`dt`).

Used for furniture that should produce a fixed output regardless of quantity owned.

## Caststoppers

Type: Array (`<Number>`)

Format:

- Array of numbers representing binary state flags

An array of state flags that would prevent the relevant spell from being able to be cast.
Numbers are based on flags in states.js and are binary flags.

Common numbers:

- 4 - NO_SPELLS also known as "silence". By default any spell that does not have caststoppers explicitly defined will have this as a caststopper.
- 1 - NO_ATTACK also known as "entangle". For things that are physical attacks.

## Category-Specific Properties

Properties that are specific to certain categories are documented within their respective category sections below.

# Resources

Resources represent consumable or collectible items that can be gathered, stored, and used throughout the game.

```json
{
	"id": "gold",
	"group": "basic",
	"desc": "Gold coins.",
	"locked": false,
	"max": 5,
	"sortOrder": 5
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [tags](#tags-property), [max](#max), [rate](#rate), [group](#group), [unit](#unit), [reverse](#reverse), [reverseDisplay](#reverseDisplay), [defeatstat](#defeatstat), [restrate](#restrate).

## Max

Type: Number or [mod string](#mod-strings)

Default Value: 0 (unlimited if not specified)

The maximum capacity for a resource. When `max` is 0 or undefined, the resource has no limit.
When `max` is a positive number, the resource cannot exceed this value.
`max` can be modified by [mod](#mod) properties from other items.

## Rate

Type: Number or [mod string](#mod-strings)

Default Value: 0

The rate at which a resource generates per game tick.
Positive values cause the resource to increase over time.
Negative values cause the resource to decrease over time.
Rate is scaled by game tick time (120ms default).

## Group

Type: String

Optional grouping identifier for organizing resources in the UI.
Resources with the same `group` value are displayed together.

## Unit

Type: Boolean

Default Value: true

If `true`, the resource value is displayed as an integer (rounded down).
If `false`, the resource value is displayed as a float with decimal precision.
Used to control how resource values appear in the UI (e.g., `unit: false` for resources like research that use fractional values).

## Reverse

Type: Boolean

Default Value: false

If `true`, the resource uses reverse logic where empty (at max) means used up, and filled (at 0) means available.
When `reverse: true`, the resource is created as a `RevStat` instead of a regular `Resource`.
Used for resources like `space` or stressors where higher values represent less availability.

## ReverseDisplay

Type: Boolean

Default Value: false

If `true`, inverts the display of the resource value in the UI.
Used for display purposes to show resources in a more intuitive way (e.g., showing "available" instead of "used").

## Defeatstat

Type: Boolean

Default Value: false

If `true`, this resource/stat is checked when determining if the player is defeated.
When any resource with `defeatstat: true` is below or above a max (controlled with the `reverse` property) the player is considered defeated, for example:

```json
{
	"id": "rage",
	"name": "frustration",
	"desc": "Rising book-throwing urges.",
	"tags": "stress",
	"reverse": true,
	"max": 10,
	"defeatstat": true
}
```

Here if `rage` exceeds 10 then the player is defeated. Or for a stat like `stamina`.

```json
{
	"id": "stamina",
	"max": 10,
	"val": 10,
	"unit": false,
	"locked": false,
	"defeatstat": true
}
```

Here if `stamina` is depleted then the character is defeated. So, for normal stats like `hp`, empty means value is 0 or below. For reverse stats (like `rage` or other stress resources), empty means value is at or above max.

## Restrate

Type: String or Number

A [mod string](#mod-strings) or number defining the rate at which the resource regenerates during rest.
Applied per second while the character is resting (not in combat).
Used for resources that restore faster when resting (e.g., `barrier` restoring at `"g.barrier.max*0.1"` per second while resting).

# Armors

Armors represent protective equipment that can be worn to reduce damage and provide modifiers.

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [level](#level), [tags](#tags-property), [slot](#slot), [armor](#armor), [alter](#alter), [enchants](#enchants), [kind](#kind), [sell](#sell), [material](#material).

Armors are equipment items that provide protection and modifiers when equipped.
They can be crafted from [materials](#materials) and modified with [properties](#properties) and [enchants](#enchants).

# Classes

Classes represent character classes or professions that provide permanent modifiers and unlock new capabilities.

```json
{
	"id": "job_smith",
	"name": "Smith",
	"tags": "t_job",
	"actdesc": "Smith equipment for your master to enchant.",
	"require": "g.crafting>=5",
	"warn": true,
	"cost": {
		"gold": 250
	},
	"result": {
		"player.exp": 20
	},
	"mod": {
		"gold.rate": 0.1,
		"lore.max": 2,
		"crafting.max": 1,
		"weaponlore.max": 1
	},
	"flavor": "Is it normal to feel the ringing of the hammer in my arm when I wake up the next day?"
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [cost](#cost), [tags](#tags-property), [actdesc](#actdesc), [actname](#actname).

## Actdesc

Type: String

An alternative description shown when the class is available but not yet purchased.
Used to provide different text for unlocked vs purchased states.

## Actname

Type: String

An alternative name displayed when the class's value is less than 1 (not yet unlocked).
When `value < 1`, the UI displays `actname` instead of the regular `name`.
Used to show a different name for locked/unavailable classes (e.g., "Apprenticeship" instead of the class name).

Classes are permanent character choices that modify the player's capabilities.
They typically have high [cost](#cost) requirements and provide significant [mod](#mod) bonuses.

# Dungeons

Dungeons represent challenging locations with combat encounters and bosses.

```json
{
	"id": "pestcontrol",
	"name": "Leaky Cellar",
	"start": {
		"name": "Pest Control",
		"desc": "After your daily castigation, your master mentions the rats in the basement have become a problem. Something about stolen shortswords and building barricades. You had better go down and deal with it."
	},
	"log": {
		"name": "Pests Clear",
		"desc": "With the basement cleared your master will have more room to stash all the gold you've been earning."
	},
	"difficulty": "🦴",
	"sortOrder": 1,
	"require": "t_job",
	"dist": 0,
	"repeat": false,
	"run": { "stamina": 0.7 },
	"result": {
		"arcana": 10,
		"gold": "15~20",
		"player.exp": 10,
		"title": "Master of the Cellar"
	},
	"length": 10,
	"boss": "ratking",
	"spawns": [["lgmouse", "lgmouse"], "badexperiment", "ratskeleton", "homunculus", "gremlin", "lgrat"]
}
```

Uses properties: Same as [locales](#locales), plus [difficulty](#difficulty), [sortOrder](#sortOrder), [log](#log), [boss](#boss), [spawns](#spawns).

## Difficulty

Type: String

A visual indicator of dungeon difficulty using bone or skull emojis (e.g., `"🦴"`, `"🦴🦴"`, `"🦴🦴🦴"`, `"💀"`, `"💀💀"`, `"💀💀💀"`, etc).

- **🦴** (bones) Indicate dungeon difficulty prior to Tier 1. One bone to three bones in increasing difficulty.
- **💀** (skull) - Dungeon difficulty post Tier 1. One skull to six skulls in increasing difficulty with each skull representing a minimum tier level, for example six skulls in a Tier 6 difficulty.

Used for UI display and sorting.

## SortOrder

Type: Number

Determines the order in which dungeons appear in lists.
Lower numbers appear first.

## Log

Type: Object

An object with `name` and `desc` properties that define a log entry created when the dungeon is completed.
Used for tracking completion and providing story context.

Dungeons function similarly to locales but are specifically designed for combat encounters.
They have a [boss](#boss) monster (see [Locales](#locales)) and [spawns](#spawns) array (see [Locales](#locales)) defining combat encounters.

# Enchants

Enchants represent magical enhancements that can be applied to equipment.

Uses properties: [id](#id), [name](#name), [desc](#desc), [level](#level), [tags](#tags-property), [alter](#alter), [only](#only).

## Only

Type: String or Array (`<String>`)

A list of target types, names, kinds, or tags that the enchant can be applied to.
Used to restrict enchants to specific equipment types.

Enchants modify equipment properties when applied.
They use the `alter` property to define how they modify the target item.

# Encounters

Encounters represent random events or situations that can occur within locales or dungeons.

```json
{
	"id": "enc_bookworm",
	"name": "bookworm",
	"desc": "A studious annelid to choose a home within a tome's pages.",
	"effect": {
		"bf": "1~2",
		"lore.exp": 1
	}
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [level](#level), [tags](#tags-property), [effect](#effect), [result](#result), [loot](#loot), [length](#length), [rate](#rate).

Encounters are sub-locations within locales that trigger when the locale is visited.
They can provide resources, modify stats/mood, unlock events, or grant experience.

# Events

Events represent special occurrences or story moments that can be triggered during gameplay.

```json
{
	"id": "evt_scroll",
	"name": "A tattered scroll",
	"require": "g.scrolls>0",
	"desc": "You buy a strange scroll from a travelling peddler. If you could only decipher the cryptic symbols."
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [require](#require), [result](#result), [cd](#cd), [repeat](#repeat), [disable](#disable), [enable](#enable).

## Cd

Type: Number

Cooldown time in seconds before the event can trigger again.
Used to prevent events from triggering too frequently.

## Disable

Type: String or Array (`<String>`)

An item id or array of item ids that become disabled when this event is triggered.
When the event occurs, the specified items are disabled (made unavailable) via `g.disable()`.
Used for events that should disable certain items or upgrades when triggered.

## Enable

Type: String or Array (`<String>`)

An item id or array of item ids that become enabled when this event is triggered.
When the event occurs, the specified items are enabled (made available) via `g.enable()`.
Used for events that should unlock or enable certain items when triggered.

## Lock

Type: String or Array (`<String>`)

An array of item ids (typically encounters, events, or other items) that become locked (unavailable) when this event is triggered.
Used to prevent certain content from appearing after the event occurs.
Works the same as the `lock` property for [upgrades](#upgrades).

# Furniture

Furniture represents items that can be placed in the player's home to provide ongoing benefits.

```json
{
	"id": "woodbed",
	"name": "wooden bed",
	"desc": "Small wooden bed.",
	"tags": "bed",
	"slot": "bed",
	"require": "g.stamina>=15&&g.evt_helper>0",
	"cost": {
		"gold": 40
	},
	"mod": {
		"t_rest.effect.stamina": 0.3,
		"t_rest.effect.vigor": 0.03,
		"t_rest.effect.hp": 0.2,
		"t_rest.effect.stress": -0.3,
		"space": 2
	}
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [slot](#slot), [tags](#tags-property), [max](#max), [convert](#convert).

Furniture items provide permanent modifiers or resource generation when placed.
They can have [convert](#convert) properties to generate resources over time.

# Homes

Homes represent locations where the player can place furniture and rest.

Uses properties: [id](#id), [name](#name), [desc](#desc), [require](#require), [mod](#mod), [cost](#cost), [slot](#slot).

Homes function as equipment slots (using the HOME slot type) that can be purchased and equipped.
They provide a location for furniture placement and may grant modifiers.

# Locales

Locales represent locations that can be visited for exploration, encounters, and rewards.

```json
{
	"id": "mustylibrary",
	"name": "musty library",
	"sym": "📖",
	"desc": "A good apprentice spends all their free time in the library. After chores, of course.",
	"level": 1,
	"require": "evt_helper",
	"length": 15,
	"run": {
		"stamina": 0.2
	},
	"result": {
		"arcana": 1,
		"research": 10,
		"scrolls": "1~4"
	},
	"encs": ["enc_bookworm", "enc_tapestry", "enc_primer1", "enc_chest1", "enc_scrollpile", "enc_workbook1"]
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [tags](#tags-property), [result](#result), [effect](#effect), [run](#run), [runmod](#runmod), [length](#length), [dist](#dist), [spawns](#spawns), [encs](#encs), [start](#start), [once](#once), [bars](#bars), [boss](#boss).

## Dist

Type: Number

The distance requirement that must be met before the locale can be visited.
Player's distance (`g.dist`) must be greater than or equal to the locale's `dist` value.

## Spawns

Type: Array (`<String>` or `<Array>`) or Object

An array defining what monsters or encounters spawn in the locale.
Can contain single monster ids, arrays of monster ids for multiple spawns, or encounter ids.

Alternatively, can be an object with spawn parameters for random generation:

- **`level`**: Number or Range string (e.g., `"45~75"`). The base level of monsters to spawn. If a range is provided, it scales with dungeon progress (0% progress = lower bound, 100% progress = upper bound).
- **`quantity`**: Number or Range string (e.g., `"1~4"`). How many monsters to spawn. If a range is provided, a random quantity within that range is selected.
- **`quantitypenalty`**: Number (default: `0.05`). Level penalty per additional spawn beyond the first. For each extra spawn, the level is reduced by this percentage. Formula: `level *= Math.max(1 - (quantity - 1) * penalty, 0.1)`. Minimum level is capped at 10% of original.
- **`range`**: Number. Individual level variation for each spawn. Each monster's level can vary by ±`range` from the calculated base level. Formula: `spawnLevel = level + range * (2 * Math.random() - 1)`.

```json
{
	"id": "catacrypts",
	"name": "The Catacrypts",
	"spawns": {
		"level": "45~75",
		"range": 2,
		"quantity": "1~4",
		"quantitypenalty": 0.14
	}
}
```

Here, at dungeon start (0% progress), monsters are around level 45. At the end (100% progress), they're around level 75. Progress scales linearly. The dungeon randomly spawns 1, 2, 3, or 4 monsters. If 2 monsters spawn, level is reduced by 14% (`level * 0.86`). If 3 spawn, level is reduced by 28% (`level * 0.72`). If 4 spawn, level is reduced by 42% (`level * 0.58`). Each monster's level can vary by ±2 from the penalized base level. For example, if the base level after penalty is 50, each monster could be level 48-52.

## Encs

Type: Array (`<String>`)

Alias for [spawns](#spawns) (see [Locales](#locales)).
An array of encounter ids that can occur in this locale.

## Start

Type: Object

An object with `name` and `desc` properties that define the initial description when first visiting the locale.
Used for story text or introduction messages.

## Once

Type: Object

A [result](#result) object that applies only the first time the locale is completed.
After the first completion, this result no longer applies.

## Bars

Type: String or Array (`<String>`)

A list of progress bar resource ids to display in the locale UI.
Used to show relevant resource progress while exploring.

## Boss

Type: Object

The id of a monster that serves as the boss encounter for this locale.

You can also specify a depth at which the boss appears.

```json
"boss": { "40": ["karnivex", "greendragon", "greendragon"] },
```

# Materials

Materials are used in crafting and equipment creation.

Uses properties: [id](#id), [name](#name), [desc](#desc), [level](#level), [tags](#tags-property), [alter](#alter).

Materials modify equipment properties when used in crafting.
They use the [alter](#alter) property to define how they modify the final item.

# Monsters

Monsters represent enemies that can be encountered in combat.

```json
{
	"id": "gardengnome",
	"name": "garden gnome",
	"desc": "Standard variety garden gnome.",
	"kind": "humanoid",
	"biome": ["town", "plains", "hills"],
	"level": 3,
	"hp": 3,
	"spells": "magicmissile",
	"attack": {
		"dev": "spell is enough dmg, so attack doesn't deal anything",
		"dot": {
			"name": "wink",
			"%": "10%",
			"duration": 1,
			"id": "paralyze"
		}
	},
	"loot": [{ "scrolls": 1 }]
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [level](#level), [hp](#hp), [barrier](#barrier), [recharge](#recharge), [defense](#defense), [speed](#speed), [tohit](#tohit), [dodge](#dodge), [attack](#attack), [resist](#resist), [regen](#regen), [loot](#loot), [unique](#unique), [noproc](#noproc), [kind](#kind), [spells](#spells), [biome](#biome), [onDeath](#onDeath), [onHit](#onHit), [onMiss](#onMiss), [onSummon](#onSummon), [chaincast](#chaincast), [chainhit](#chainhit), [statedata](#statedata).

## Hp

Type: Number

The monster's hit points (health).
When HP reaches 0, the monster is defeated.

## Barrier

Type: Number

The monster's barrier (damage-absorbing shield). Barrier absorbs incoming damage before HP is reduced.

When damage is dealt to a monster:

- If `barrier >= damage`: The barrier absorbs all damage, barrier decreases by the damage amount, and HP remains unchanged.
- If `barrier < damage`: The barrier is depleted to 0, and the remaining damage (`damage - barrier`) is applied to HP.

Barrier can be recharged over time if the monster has a `recharge` property. The recharge rate is applied per second: `barrier += recharge * second`.

```json
{
	"id": "shielded_golem",
	"hp": 100,
	"barrier": 200,
	"recharge": 5
}
```

This monster starts with 200 barrier, which will recharge at 5 per second because it has the `recharge` property.

## Recharge

Type: Number

The rate at which the monster's barrier recharges per second. If a monster has both `barrier` and `recharge` properties, its barrier will automatically regenerate over time.

The recharge rate is applied per second: `barrier += recharge * second`.

```json
{
	"id": "regenerating_shield",
	"hp": 50,
	"barrier": 100,
	"recharge": 10
}
```

This monster starts with 100 barrier and will regenerate 10 barrier per second.

## Defense

Type: Number

Defense reduces incoming damage as a percentage modifier. The default value is 0 (no change to damage). Values above 0 reduce damage, values below 0 increase damage.

The defense formula is applied as a multiplier to incoming damage (after resistance): If defense > 0: `damage_multiplier = 100 / (100 + defense)`. If defense <= 0: `damage_multiplier = 2 - 100 / (100 - defense)`. At defense = 0, the multiplier is 1.0 (no change). For example, defense = 100 gives `100/(100+100) = 0.5` (50% damage reduction), defense = -50 gives `2 - 100/(100-(-50)) = 2 - 0.667 = 1.333` (133% damage, or 33% increase). Defense is applied after resistance in the damage calculation chain.

**Note**: Defense is applied AFTER `resist` in the damage calculation chain. Both `defense` and `resist` use diminishing returns formulas, making it relatively easy to reach 50% reduction from each (0.5 × 0.5 = 0.25, or 25% of original damage, meaning ~1/4 of posted damage). Combined with 50% `dodge` chance, expected incoming damage can be as low as ~1/8 of posted damage at endgame levels.

## Speed

Type: Number

Determines turn order and action frequency in combat.
Higher speed values act more frequently.

## Tohit

Type: Number

Bonus to hit chance in combat. Increases accuracy and reduces the target's effective dodge chance. The `tohit` value is added to the attacker's base hit chance and reduces the defender's dodge chance via the formula: `dodge_chance = dodge / (100 + dodge + tohit)`. Higher `tohit` values make attacks more likely to hit and reduce the effectiveness of the defender's `dodge` stat.

## Dodge

Type: Number

Chance to avoid attacks. The default value is 0 (no dodge chance). The dodge chance formula is: `dodge_chance = dodge / (100 + dodge + tohit)` when dodge > 0, otherwise 0. The attacker's `tohit` stat reduces the defender's effective dodge chance. For example, with dodge = 100 and tohit = 0: `100/(100+100+0) = 0.5` (50% dodge chance). With dodge = 100 and tohit = 100: `100/(100+100+100) = 0.333` (33% dodge chance).

## Attack

Type: Object or Array (`<Object>`)

Defines the monster's attack(s).
Can be a single attack object or an array of attack objects.
Attack objects define damage, damage type, targets, and other combat properties.

## Resist

Type: Object (`<String, Number>`)

Damage type resistances as percentages.

The default value is 0 (no change to damage). Values above 0 reduce damage, values below 0 increase damage.

The resistance formula is applied as a multiplier to incoming damage: If resist > 0: `damage_multiplier = 50 / (50 + resist)`. If resist <= 0: `damage_multiplier = 2 - 50 / (50 - resist)`. At resist = 0, the multiplier is 1.0 (no change). For example, resist = 50 gives `50/(50+50) = 0.5` (50% damage reduction), resist = -50 gives `2 - 50/(50-(-50)) = 2 - 0.5 = 1.5` (150% damage, or 50% increase). Resistances are applied before defense in the damage calculation chain.

## Bonuses

Type: Object (`<String, Stat>`)

Damage bonuses per damage kind. Used to increase damage dealt of specific damage types.

Can be modified via mod properties using the format `self.bonuses.<kind>` (e.g., `"self.bonuses.fire": "1%"`). This allows items, skills, or other modifiers to increase damage bonuses for specific damage types.

When an attack is performed the bonus for the attack's damage kind is added to the base damage. The bonus is added as flat damage: `damage += attacker.getBonus(attack.kind)`.

```json
{
	"mod": {
		"self.bonuses.fire": "5%",
		"self.bonuses.mana": "10%"
	}
}
```

This would add 5% to the bonus for fire damage and 10% to the bonus for mana damage.

## Immune

Type: String or Object (`<String, Stat>`)

Alias: `immunities`

Format:

- **String**: Comma-separated list of damage kinds or states (e.g., `"immune": "spirit,poison"` or `"immune": "fire,spirit,sleep,fear,paralysis"`)
- **Object**: Object mapping damage kind strings to Stat objects

Damage kinds or states that the character is completely immune to. If an attack's `kind` matches an immunity, the attack is completely blocked and no damage is dealt.

```json
{
	"id": "cockatrice",
	"level": 30,
	"kind": "magicbeast",
	"desc": "The stare of the cockatrice is death.",
	"speed": 8,
	"hp": 300,
	"attack": [
		{
			"name": "gaze",
			"kind": "earth",
			"damage": "30~60",
			"dot": {
				"id": "paralyze",
				"duration": 0.75
			}
		}
	],
	"immune": "paralyze"
}
```

The cockatrice (due to its own paralyzing power) is immune to being paralyzed.

Immunities can also be modified via mod properties using the format `self.immunities.<kind>` (e.g., `"self.immunities.silence": 1` to grant immunity, or `"self.immunities.silence": -1` to remove an existing immunity).

```json
{
	"id": "immuneblind",
	...
	"dot": {
		"duration": 30,
		"mod": { "self.immunities.blind": 1 }
	}
}
```

The `immuneblind` spell grants immunity to blindness.

## Regen

Type: Number

Hit points regenerated per second.
The monster heals this amount each game tick.

## Unique

Type: Boolean

Default Value: false

If `true`, indicates this is a unique boss or special monster. It can only be encountered once, and, after being defeated, does not reappear.

**Note**: Unclear if this works? Ask in Discord.

## Noproc

Type: Boolean

Default Value: false

If `true`, prevents this monster from being randomly generated or "proc'd" in random generation systems (such as Catacrypts or Unstable Spire), even if the monster is at the appropriate level.

Monsters with `noproc: true` are excluded from random item generation groups, similar to `unique` monsters. This is useful for special monsters that shouldn't appear randomly but aren't quite "unique" (which can only be encountered once).

```json
{
	"id": "special_monster",
	"level": 50,
	"noproc": true
}
```

This monster will not be randomly generated in locations that pull from level-appropriate monster lists, even though it's level 50.

## Kind

Type: String

The kind of monster, e.g. `humanoid`, `magicbeast`, `undead`. This is used to determine if the monster is subject to certain effects, for example if they are a valid target for support spells, or if they as your minions should be buffed by certain effects.

## Spells

Type: String

A comma-separated list of spell ids that the monster can cast in combat.

## OnDeath

Type: Object

An attack object that is performed when the monster dies.
Uses the same format as [attack](#attack) property.
Executed automatically upon monster death, before loot is awarded.

## OnHit

Type: Object

A defensive counterattack that is performed when the monster/character **is hit** by an attacker. Uses the same format as [attack](#attack) property. Executed automatically when an attacker successfully hits this monster or character. The counterattack is only triggered if the incoming attack is not `unreflectable`.

## OnMiss

Type: Object

A defensive counterattack that is performed when the monster/character **is missed** by an attacker. Uses the same format as [attack](#attack) property. Executed automatically when an attacker misses this monster or character. The counterattack is only triggered if the incoming attack is not `unreflectable`.

## OnSummon

Type: Object

An attack object that is performed when the monster is summoned.
Uses the same format as [attack](#attack) property.
Executed automatically when the monster enters combat via summoning.

## Chaincast

Type: Number

Determines the number of spells cast per combat turn. The value represents the average number of spells cast per turn, calculated using the formula: `Math.floor(chaincast) + (Math.random() < chaincast - Math.floor(chaincast))`. The whole number part is the base number of spells cast every turn, and the decimal part represents the percentage chance for one additional spell. For example: `chaincast = 0.8` means `floor(0.8) = 0` base spells, with an 80% chance (`0.8 - 0 = 0.8`) of casting 1 additional spell, resulting in 0 spells 20% of the time and 1 spell 80% of the time. `chaincast = 3.2` means `floor(3.2) = 3` base spells, with a 20% chance (`3.2 - 3 = 0.2`) of casting 1 additional spell, resulting in 3 spells 80% of the time and 4 spells 20% of the time.

The default values are 0.8 for monsters, 1.0 for players.

**Note**: While technically an average, the variance is very low at whole numbers (e.g., `chaincast = 3` always casts exactly 3 spells per turn).

## Chainhit

Type: Number

Determines the number of weapon attacks performed per combat turn. Works identically to [chaincast](#chaincast), but applies to weapon attacks instead of spells. The value represents the average number of attacks per turn, calculated using the formula: `Math.floor(chainhit) + (Math.random() < chainhit - Math.floor(chainhit))`. The whole number part is the base number of attacks performed every turn, and the decimal part represents the percentage chance for one additional attack. For example: `chainhit = 1.5` means `floor(1.5) = 1` base attack, with a 50% chance (`1.5 - 1 = 0.5`) of performing 1 additional attack, resulting in 1 attack 50% of the time and 2 attacks 50% of the time. `chainhit = 2.8` means `floor(2.8) = 2` base attacks, with an 80% chance (`2.8 - 2 = 0.8`) of performing 1 additional attack, resulting in 2 attacks 20% of the time and 3 attacks 80% of the time.

The default value is 1 for both monsters and players.

**Note**: As with `chaincast`, while technically an average, the variance is very low at whole numbers (e.g., `chainhit = 2` always performs exactly 2 attacks per turn).

## Statedata

Type: Object

A custom state data template that defines initial stat values for the monster.
Used to override default stat generation and provide custom stat distributions.
The template should mirror the game's gdata structure with stat IDs as keys and values/objects as values.
Minimum required: all player stats must be defined in the template.

# Player

The player category defines player-specific properties and starting stats.

Uses properties: [id](#id), and various stat properties.

The player object is a special singleton that represents the player character.
It contains base stats and properties that define the player's capabilities.

# Potions

Potions represent consumable items that provide temporary or instant effects.

```json
{
	"id": "pot_invisibility",
	"name": "vial of invisibility",
	"desc": "Appears to contain nothing at all.",
	"require": "(g.madcap>0||(g.t_chaosclass+g.t_potionclass)>=2)&&g.potions>0",
	"level": 10,
	"buy": {
		"gold": 2500,
		"research": 3000,
		"potionessence": 1
	},
	"cost": {
		"herbs": 30,
		"gold": 2500,
		"spiritgem": 25,
		"hp": 50,
		"spirit": 10,
		"potionessence": 1
	},
	"use": {
		"dot": {
			"id": "pot_invisibility_effect",
			"name": "invisibility",
			"duration": 1800,
			"mod": {
				"player.dodge": 5,
				"player.speed": 5,
				"t_heist_act.result.gems.min": 1,
				"t_heist_act.result.gems.max": 1,
				"t_heist_act.length": -25
			}
		}
	}
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [level](#level), [cost](#cost), [buy](#buy), [sell](#sell), [tags](#tags-property), [use](#use), [stack](#stack), [consume](#consume), [repeat](#repeat), [cd](#cd).

## Buy

Type: Object

Format: Same as [cost](#cost).

A one-time cost to unlock the ability to use the potion.
Once `buy` is paid, the potion becomes available for use.
Distinct from [cost](#cost), which is paid each time the potion is used.

## Sell

Type: Object

Format: Same as [cost](#cost).

Resources received when selling the potion.
Used for potions that can be sold to vendors.

## Use

Type: Object

Defines what happens when the potion is consumed.
Can contain [effect](#effect), [dot](#dot), [attack](#attack), or [action](#action) properties.

## Stack

Type: Boolean

Default Value: true

If `true`, multiple instances of the potion can be stacked in inventory.
If `false`, each potion instance is separate.

## Consume

Type: Boolean

Default Value: true

If `true`, the potion is consumed (removed from inventory) when used.
If `false`, the potion remains after use and can be used again (subject to cooldown).

**Note**: Not generally used beyond the default.

## Cd

Type: Number

Default Value: 0

Cooldown time in seconds before the potion can be used again.
Used for potions with limited use frequency.

# Rares

Rares represent unique or special equipment items that can be obtained through gameplay.

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [level](#level), [type](#type), [slot](#slot), [tags](#tags-property), [unique](#unique), [alter](#alter), [armor](#armor), [damage](#damage), [attack](#attack), [enchants](#enchants), [sell](#sell), [stack](#stack), [use](#use).

## Type

Type: String

The equipment type: "armor" or "weapon".
Determines which category the rare belongs to.

## Slot

Type: String

The equipment slot the rare occupies (e.g., "mainhand", "head", "trinket", "mount", "rest").

## Armor

Type: Number

Armor value provided by the item.
Only applies to armor-type rares.

## Damage

Type: String or Number

Damage value or range for weapons (e.g., `"10~18"` or `10`).
Only applies to weapon-type rares.

## Enchants

Type: Number

The number of enchantment slots available on the item.
Determines how many enchants can be applied.

## Unique

An item that can only exist once, if you already have one, then getting it again from any source will not do anything.

# Resources

# Sections

Sections are organizational containers used in the UI to group related content.

Uses properties: [id](#id), [name](#name).

Sections are used primarily for UI organization and do not have game play effects.

# Skills

Skills represent abilities that the player can learn that provide modifiers and unlock new capabilities.

```json
{
	"id": "naturelore",
	"name": "nature studies",
	"verb": "observing nature",
	"tags": "t_school",
	"require": "g.herbalism>=3&&g.lore>=3",
	"buy": {
		"arcana": 8
	},
	"run": {
		"stamina": 0.2
	},
	"mod": {
		"research.max": 5,
		"nature": {
			"max": 1,
			"rate": 0.01
		}
	}
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [buy](#buy), [tags](#tags-property), [max](#max), [rate](#rate), [run](#run), [runmod](#runmod).

## Max

Type: Number or [mod string](#mod-strings)

The maximum level the skill can reach.
Skills cannot exceed this level through normal progression.

## Rate

Type: Number or [mod string](#mod-strings)

The rate at which the skill gains experience per game tick.
Used for skills that passively gain experience over time.

## School

Type: String

The magical school the skill belongs to (e.g., "arcane", "nature", "fire").
Used for school-based categorization and requirements.
Similar to spell schools but for skills.

## Verb

Type: String

Optional custom verb to display instead of the default action verb.
Used in UI to show what the player is doing (e.g., "reading lore" instead of "performing").
Works the same as the `verb` property for [tasks](#tasks).

# Spells

Spells represent magical abilities that can be cast to produce effects or attacks.

```json
{
	"id": "magicmissile",
	"name": "magic missile",
	"sortOrder": 406,
	"level": 1,
	"school": "mana",
	"keywords": {
		"type": ["damage"],
		"target": ["enemy"],
		"targets": ["single"],
		"delivery": ["instant"]
	},
	"require": "g.spellbook>0&&g.lore>0",
	"buy": {
		"research": 25,
		"scrolls": 1
	},
	"cost": {
		"mana": 1
	},
	"result": {
		"lore.exp": 0.1
	},
	"attack": {
		"damage": "1.5~2.5",
		"kind": "mana",
		"tohit": 2,
		"potencies": ["spelldmg", "manadmg"]
	},
	"at": {
		"10": {
			"attack.damage.max": 1
		},
		"50": {
			"attack.damage.min": 1
		},
		"200": {
			"attack.damage.max": 1,
			"attack.damage.min": 1
		}
	}
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [buy](#buy), [tags](#tags-property), [school](#school), [keywords](#keywords), [attack](#attack), [action](#action), [effect](#effect), [dot](#dot), [result](#result), [cd](#cd), [caststoppers](#caststoppers), [only](#only), [summon](#summon).

## School

Type: String

The magical school the spell belongs to (e.g., "fire", "nature", "charm").
Used for school-based requirements and categorization.

## Keywords

Type: Object

An object defining spell characteristics for targeting and filtering.
Contains properties like `type`, `target`, `targets`, and `delivery` as arrays of strings.

## Attack

Type: Object or Array (`<Object>`)

Defines the spell's attack(s) when cast.
Can be a single attack object or an array of attack objects.
Attack objects define damage, damage type, targets, and other combat properties.

## Action (deprecated)

Type: Object

An alternative to [attack](#attack) for spells that perform non-damage actions.
Uses the same format as attack but may have different targeting or effects.

## Dot

Type: Object

Defines a damage-over-time or effect-over-time that the spell applies.
Contains `duration` (in seconds), `effect` (stat changes), `damage` (damage over time), or `mod` (modifiers).

### Attack Object Properties

The following properties can be used within attack objects (used in spells, monsters, weapons, and other combat items):

#### Name

Type: String

The display name of the attack.
Used in combat logs and UI to identify the attack.
If not specified, inherits from the parent item's name.

#### Damage (or dmg)

Type: String, Number, or Range

The damage dealt by the attack.
Can be a number (e.g., `10`), a range string (e.g., `"10~20"`), or a [mod string](#mod-strings).
Alias `dmg` can be used instead of `damage`.

#### Kind

Type: String

The damage type of the attack (e.g., `"fire"`, `"shadow"`, `"blunt"`, `"pierce"`, `"spirit"`).
Determines which resistance stat applies to reduce damage.
Used for damage type calculations and resistances.

#### Type

Type: String or Array (`<String>`)

The attack type classification (e.g., `"damage"`, `"buff"`, `"debuff"`).
Used for categorization and filtering in the UI.
Can be an array for multiple types.

#### Tohit

Type: Number

Default Value: 0

Bonus to hit chance for the attack.
Adds to the attacker's base hit chance.
Positive values increase accuracy, negative values decrease it.

#### Targets

Type: String or Array (`<String>`)

Target specification for the attack.
Can be a string like `"enemy"`, `"ally"`, `"single"`, `"fixed"`, or an array of target types.
Used to define which targets the attack can hit. See combat targeting constants for available values.

#### Targetspec

Type: Object

A complex target specification with conditions for targeting.
Contains properties that define targeting criteria, such as `conditiontext` for display purposes.
Used for advanced targeting logic in attacks.

#### Potencies

Type: Array (`<String>`)

An array of potency stat IDs that affect damage scaling.
Potencies are special stats that modify damage calculations.
When an attack has potencies, damage is scaled based on the values of those potency stats.

#### Dot

Type: Object or Array (`<Object>`)

A damage-over-time or effect-over-time that the attack applies.
Can be a single dot object or an array of dot objects.
See [Dot Object Properties](#dot-object-properties) for available dot properties.

#### Flags

Type: String or Array (`<String>`)

Attack flags that modify behavior (e.g., `"noattack"`).
Flags can prevent certain actions or modify how the attack functions.
Common flags include combat-related restrictions.

#### Unreflectable

Type: Boolean

Default Value: `false` for regular attacks and `true` for dots and onHit counterattacks.

If `true`, the attack does not trigger counterattacks on the target. When `false`, the attack can trigger counterattacks including `onHit`, thorns (`stat_thorns`), and reflect (`stat_reflect`) effects.

**Note**: Dots default to `unreflectable: true` because otherwise every tick of every dot would trigger counterattacks, which would be unworkable. OnHit counterattacks default to `unreflectable: true` to prevent infinite loops where a counterattack provokes another counterattack. All counterattacks (onHit, thorns, reflect) are technically 'onhits' - they all use the same counterattack mechanism.

#### Only

Type: String or Array (`<String>`)

A list of target types, names, kinds, or tags that the attack can target.
Restricts the attack to specific target categories.
Used for attacks with limited targeting options.

#### Result

Type: Object (`<String, Number>` or `<String, Object>`)

Effects applied to the target when the attack hits. Uses the same format as the general [result](#result) property. Only fires if the attack successfully hits (does not require damage to be dealt, just that the attack connects). Applied to the target's context.

#### Acquire

Type: Object (`<String, Number>` or `<String, Object>`)

Effects applied to the **player** when the attack hits. Uses the same format as the general [result](#result) property. Only fires if the attack successfully hits (does not require damage to be dealt, just that the attack connects).

**Note**: `acquire` always applies to the player's context, not the attacker's context. This means if a minion uses an attack with `acquire`, the effects are credited to the player, not the minion. Used for effects that should benefit the player regardless of who performs the attack.

#### Healing (or heal)

Type: String, Number, or Range

The healing amount provided by the attack.
Can be a number (e.g., `10`), a range string (e.g., `"10~20"`), or a [mod string](#mod-strings).
Alias `heal` can be used instead of `healing`.

#### Cure

Type: String or Array (`<String>`)

A list of state IDs to remove from the target when the attack hits.
Used for attacks that cure or remove status effects.
Can be a comma-separated string or an array.

#### State

Type: String or Array (`<String>`)

A list of state IDs to apply to the target when the attack hits.
Used for attacks that apply status effects.
Can be a comma-separated string or an array.

#### Summon

Type: Object or Array (`<Object>`)

Defines what creatures or allies the attack summons.

Each object contains `id` (monster id), `count` (number to summon, default: 1), and optionally `max` (maximum number of that monster type that can exist, default: 0 for unlimited)

Used for attacks that create additional combatants.

#### Hits

Type: Array (`<Object>`)

An array of additional attack objects that trigger when this attack hits.
Each hit object can have its own damage, kind, targets, etc.
Used for multi-hit attacks or combo attacks.

#### Bonus

Type: Number or [mod string](#mod-strings)

Additional damage bonus applied by the attack.
Added to the base damage calculation.

#### Harmless

Type: Boolean

Default Value: false (auto-calculated based on targets)

If `true`, the attack cannot miss or be avoided.
Automatically set to `true` if targets don't include enemies.
Used for guaranteed effects.

#### Nodefense

Type: Boolean

Default Value: false

If `true`, the attack ignores the target's defense stat.
Damage is calculated without applying defense reduction.
Used for attacks that bypass armor.

#### NoLogs

Type: Boolean

Default Value: false

If `true`, the attack does not generate combat log messages.
Used for silent attacks or background effects.

### Dot Object Properties

The following properties can be used within dot objects (used in spells, attacks, monsters, and potions):

#### Duration

Type: Number

The duration of the dot in seconds.
If not specified, the dot becomes permanent (`perm: true`).
The dot applies its effects continuously over this duration.

#### Damage (or dmg)

Type: String, Number, or Range

The damage dealt per second by the dot.
Can be a number (e.g., `10`), a range string (e.g., `"10~20"`), or a [mod string](#mod-strings).
Alias `dmg` can be used instead of `damage`.

#### Effect

Type: Object (`<String, Number>` or `<String, Object>`)

Stat changes applied per second by the dot.
Uses the same format as the general [effect](#effect) property.
Applied continuously while the dot is active.

#### Mod

Type: Object

Modifiers applied while the dot is active.
Uses the same format as the general [mod](#mod) property.

**Note**: Mods in dots are applied when the dot is added to a character and removed when the dot expires or is removed. This is different from task `mod` properties, which persist based on the task's value.

#### Healing (or heal)

Type: String, Number, or Range

The healing amount per second provided by the dot.
Can be a number (e.g., `10`), a range string (e.g., `"10~20"`), or a [mod string](#mod-strings).
Alias `heal` can be used instead of `healing`.

#### Id

Type: String

A unique identifier for the dot.
Required to prevent conflicts with other dot effects.
If not specified, uses the dot's `name` or the parent item's `id`.

#### Kind

Type: String

The damage type of the dot (e.g., `"fire"`, `"poison"`, `"shadow"`).
Determines which resistance stat applies to reduce damage.
Inherited from the parent attack if not specified.

#### Potencies

Type: Array (`<String>`)

An array of potency stat IDs that affect damage scaling.
Potencies are special stats that modify damage calculations.
When a dot has potencies, damage is scaled based on the values of those potency stats.

#### Targets

Type: String or Array (`<String>`)

Target specification for the dot.
Can be a string like `"enemy"`, `"ally"`, `"self"`, or an array of target types.
Used to define which targets the dot can affect.

#### Targetspec

Type: Object

A complex target specification with conditions for targeting.
Contains properties that define targeting criteria, such as `conditiontext` for display purposes.
Used for advanced targeting logic in dots.

#### Flags

Type: String or Array (`<String>`)

Dot flags that modify behavior (e.g., `"noattack"`).
Flags can prevent certain actions or modify how the dot functions.
Common flags include combat-related restrictions.

#### Adj

Type: String

An adjective descriptor for dots displayed in the UI.
Used to provide flavor text describing the dot effect (e.g., "burning", "poisoned").

#### %

Type: String

A percentage chance for the dot to apply (e.g., `"25%"`).
When specified, the dot only has a chance to apply based on this percentage.
Format should be a string like `"20%"` or `"50%"`.

#### Conditiontext

Type: String

Display text shown when targeting conditions are met or not met.
Used within `targetspec` objects to provide user-facing information about targeting requirements.

#### Dotcondition

Type: String

A [function string](#js-string-syntax) that evaluates to determine if conditional dot effects should apply.
When present, the dot checks this condition each tick. If `true`, `conditional.onSuccess` effects apply; if `false`, `conditional.onFailure` effects apply.
Used for dots that have different effects based on runtime conditions (e.g., weapon type, stat values).

#### Conditional

Type: Object

An object containing conditional effects that apply based on `dotcondition` evaluation.
Contains:

- `onSuccess`: Dot object that applies when `dotcondition` evaluates to `true`
- `onFailure`: Dot object that applies when `dotcondition` evaluates to `false`

Used for creating dots with dynamic effects that change based on game state.

#### Unreflectable

Type: Boolean

Default Value: true (for dots)

If `true`, the dot cannot be reflected back at the attacker.
Dots default to `unreflectable: true` to prevent infinite reflection loops.

## Cd

Type: Number

Cooldown time in seconds before the spell can be cast again.

## Only

Type: String or Array (`<String>`)

A list of target types, names, kinds, or tags that the spell can be applied to.

Used for spells with restricted targeting. Can restrict spells to specific monster kinds.

Also used for enchants to restrict which equipment types they can be applied to.

## Resurrect

Type: Object

Defines resurrection capabilities for the spell.
Can contain:

- `only` (String or Array): Target filter - only these types/kinds/tags can be resurrected
- `maxlevel` (Number): Maximum level of targets that can be resurrected
- `count` (Number): Number of targets to resurrect per cast (default: 1)

When cast, the spell attempts to resurrect dead minions matching the criteria.
Resurrected minions are restored to half HP and barrier.

## At

Type: Object (`<String, Object>`)

Milestone modifiers that apply when the spell reaches certain value thresholds.
Format: Keys are threshold values (as strings), values are [mod](#mod) objects.
When the spell's value reaches or exceeds a threshold, the corresponding modifiers are applied.
Works the same as the `at` property for [tasks](#tasks).

## Summon

Type: Array (`<Object>`)

An array of summon objects that define what creatures or allies the spell summons.
Each object contains `id` (monster id) and `count` (number to summon).

# States

States represent temporary or permanent conditions that affect the player or NPCs.

Uses properties: [id](#id), [name](#name), [desc](#desc), [require](#require), [mod](#mod), [tags](#tags-property).

States are special items that represent conditions or status effects.
They can modify stats, prevent actions, or trigger other effects.

# Stressors

Stressors are special resources that represent negative conditions or stress. They include concepts like rage, befuddlement, and unease.

```json
[
	{
		"id": "bf",
		"tags": "stress",
		"name": "befuddlement",
		"desc": "Outright confusion in your studies.",
		"reverse": true,
		"max": 10,
		"defeatstat": true
	}
]
```

They are often applied to encounters; when adventuring and you exceed a stressor it will drop the character out of the adventure.

Uses properties: Same as [resources](#resources).

# Tags (Category)

Tagsets are listed under tags.
They are not necessary to declare, as tags will be generated automatically once listed in [tags](#tags-property), but are used to apply additional properties.

They currently use only [id](#id) and [name](#name).

## Hide

Type: Boolean
Default Value: False

Determines if the tag is shown in an item's pop-up window under tags.
Does not hide the item when listed under other properties.

## Sharecd

Type: Boolean

Default Value: false

If `true`, items with this tag share cooldowns. When an item with a `sharecd` tag and a cooldown (`cd` property) is used, the cooldown timer is applied to all other items that have the same tag. This allows groups of related items (like all health potions, all mana potions, all buffs, etc.) to share a single cooldown timer, preventing rapid sequential use. Used for items that should have group-wide cooldowns rather than individual cooldowns.

# Tasks

Tasks represent activities that the player can perform, which consume time and resources to produce effects or results.

```json
{
	"id": "cleanstables",
	"name": "clean stables",
	"desc": "Working from home.",
	"verb": "cleaning",
	"fill": "gold",
	"locked": false,
	"cost": {
		"stamina": 1
	},
	"result": {
		"gold": 2.5
	},
	"flavor": "It's stable employment.",
	"group": "starting out"
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [tags](#tags-property), [result](#result), [effect](#effect), [run](#run), [runmod](#runmod), [length](#length), [perpetual](#perpetual), [repeat](#repeat), [fill](#fill), [verb](#verb), [morality](#morality), [exclude](#exclude), [at](#at), [every](#every), [extdesc](#extdesc), [group](#group).

## Run

Type: Object (`<String, Number>`)

Format: Same as [cost](#cost), but represents ongoing costs paid per game tick while the task is active.

The ongoing price to continue using a runnable action or spell. The values in `run` are defined per second. The costs are paid each game tick (every 120ms by default), but the amount paid per tick is calculated by multiplying the `run` value by the elapsed time in seconds. For example, if `run` is `{ "stamina": 1 }`, this means 1 stamina per second. Over one game tick (0.12 seconds), `1 \* 0.12 = 0.12` stamina is paid. The actual payment frequency depends on the game tick rate, but the `run` values always represent per-second rates.

## Runmod

Type: Object

Format: Same as [mod](#mod).

Runmods are applied when a task starts running and removed when the task stops. Unlike `mod` properties, runmods do not persist based on the task's value - they are purely tied to the task's running state.

## Length

Type: Number or [mod string](#mod-strings)

The duration of the task in seconds.
If not specified, `level` may be used to determine default length for encounters.

## Perpetual

Type: Boolean

Default Value: false

If `true`, the task runs continuously without requiring manual activation each time.
Perpetual tasks complete when exp reaches 1 (if no length is set), reset exp to 0, and automatically restart if `canRun()` still passes.

## Repeat

Type: Boolean

Default Value: true for resources and tasks, false for other items

Whether the task can be performed multiple times.
If `false`, the task can only be completed once.

## Fill

Type: String or Array (`<String>`)

A resource id or array of resource ids that the task fills when it completes. Used for tasks that generate resources over time. The resource id or array of resource ids act as a blocking condition for the task. The task will be unable to run if the resource or resources listed in `fill` are maxed out. This prevents tasks from running when their target resources are already full, avoiding wasted production.

A task is not required to fill only the resources listed in `fill` - tasks can fill additional resources via their `effect`, `result`, or `convert` properties. For example, the `rest` task has `fill: ["stamina", "hp", "prismatic", "stress"]` but its `effect` also fills `vigor`, which is not listed in `fill`. Technically, a task is not required to actually produce the resources listed in `fill` (the `fill` property only checks if those resources are maxed, not whether the task produces them), although no practical use has been found for this pattern yet.

## Verb

Type: String

Optional custom verb to display instead of the default action verb.
Used in UI to show what the player is doing (e.g., "directing weaves" instead of "performing").

## Morality

Type: Boolean

Optional property used for filtering tasks in the UI.
Indicates whether the task is related to morality or alignment choices.

## Exclude

Type: String or Array (`<String>`)

Format:

- Can be a comma-separated string or an array of strings
- Values can be item types, item ids, or tags

A list of item types, IDs, or tags that prevent this task from running if any matching active task is already running.
The exclusion works bidirectionally - if task A excludes task B, and task B is running, task A cannot start (and vice versa).
Used to prevent conflicting tasks from running simultaneously.

## At

Type: Object (`<String, Object>`)

Format:

- Keys are numeric thresholds (as strings, e.g., `"20"`, `"50"`)
- Values are [mod](#mod) objects that get applied when the threshold is reached

Milestone-based modifiers that apply when the task's value reaches specific thresholds.
When the task's value reaches or exceeds a threshold, the corresponding mods are applied.
Mods are automatically removed if the value drops below the threshold.
Used for tasks that improve over time or have milestone bonuses.

Example: `"at": { "20": { "run.stamina": -0.1 }, "50": { "run.stamina": -0.1 } }`

## Every

Type: Object (`<String, Object>`)

Format:

- Keys are numeric intervals (as strings, e.g., `"10"`, `"25"`)
- Values are [mod](#mod) objects that get applied for each interval reached

Repeating milestone-based modifiers that apply for every N completions.
For every N completions (where N is the key), the mods are applied once.
Unlike `at`, these mods accumulate and don't get removed when value decreases.
Used for tasks that get progressively better with each completion cycle.

Example: `"every": { "10": { "result.gold": 1 } }`

## Extdesc

Type: String

Extended description text displayed in the UI tooltip.
Provides additional context or details beyond the main `desc` property.
Commonly used for tasks with complex results to clarify what the task accomplishes.

## Group

Type: String

Optional grouping identifier for organizing tasks in the UI.
Tasks with the same `group` value are displayed together.
Used for categorizing tasks by purpose (e.g., "rest", "research", "knowledge", "affluence").

# Upgrades

Upgrades represent permanent improvements or purchases that modify game properties.

```json
{
	"id": "mule",
	"desc": "A mount that doesn't require much training.",
	"require": "g.player.level>=4||g.animals>=2",
	"slot": "mount",
	"tags": "steed",
	"buy": {
		"gold": 100
	},
	"mod": {
		"dist": 15,
		"inv.max": 2
	},
	"group": "mount"
}
```

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [tags](#tags-property), [max](#max), [group](#group), [warn](#warn), [disable](#disable), [lock](#lock), [slot](#slot).

## Max

Type: Number

Default Value: Effectively 1 for non-repeatable upgrades (no explicit default)

The maximum number of times this upgrade can be purchased.
If `max` is 1, the upgrade is a one-time purchase.
If `max` is greater than 1, the upgrade can be purchased multiple times (up to the max value).
If `max` is not specified and the upgrade is not repeatable, it effectively behaves as if `max` is 1 (can only be purchased once). If the upgrade is repeatable and has no `max`, it can be purchased unlimited times.

## Group

Type: String

Optional grouping identifier for organizing upgrades in the UI.
Upgrades with the same `group` value are displayed together.

## Warn

Type: Boolean

Default Value: false

If `true`, displays a warning confirmation dialog before purchasing the upgrade.
Used for upgrades with significant consequences or irreversible effects.

## Disable

Type: Array (`<String>`)

An item id or array of item ids that become disabled when this event/upgrade is triggered. When the event/upgrade occurs, the specified items are disabled (made unavailable) via `g.disable()`.

**Distinction from `lock`**: `disable()` not only sets the `disabled` flag to `true`, but also removes all value/amount from the disabled items (sets value to 0). This means disabled items lose any passive benefits they provide. If an item is equipped or running, it is also unequipped/stopped. Used for events/upgrades that should completely remove certain items or upgrades when triggered, eliminating their passive effects.

## Lock

Type: String or Array (`<String>`)

An array of item ids (typically encounters, events, or other items) that become locked (unavailable) when this event/upgrade is triggered. When the event/upgrade occurs, the specified items are locked via `g.lock()`, which increments their `locks` counter.

**Distinction from `disable`**: `lock()` only increments the `locks` counter - it does NOT remove or modify the item's value/amount. This means locked items retain their current value and any passive benefits they provide (such as mods based on value). Items with `locks > 0` cannot be unlocked (`tryUnlock()` returns false) or used, but their value remains intact. Used to prevent certain content from appearing after making a choice while preserving the current state of those items.

## Slot

Type: String

If specified, the upgrade occupies a slot (e.g., "mount", "rest", "leisure"). Each slot can only contain one item from that slot's item set.

# Weapons

Weapons represent equipment items that can be equipped to provide damage and combat modifiers.

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [level](#level), [tags](#tags-property), [slot](#slot), [damage](#damage), [attack](#attack), [alter](#alter), [enchants](#enchants), [kind](#kind), [sell](#sell), [template](#template), [material](#material).

Weapons are equipment items that provide damage and combat capabilities when equipped.
They can be crafted from [materials](#materials) and modified with [properties](#properties) and [enchants](#enchants).
Weapons occupy equipment slots (typically "mainhand") and provide attack capabilities in combat.

## Damage

Type: String or Number

Damage value or range for the weapon (e.g., `"10~18"` or `10`).
When a range is specified (e.g., `"5~10"`), damage is rolled randomly within that range.
When a single number is specified, that value is used as the base damage.
Damage can be modified by [attack](#attack) properties and combat modifiers.

## Attack

Type: Object or Array (`<Object>`)

Defines the weapon's attack(s) when used in combat.
Can be a single attack object or an array of attack objects.
Attack objects define damage, damage type, targets, and other combat properties.
If not specified, the weapon uses its [damage](#damage) property as the base attack.

## Slot

Type: String

The equipment slot the weapon occupies (e.g., "mainhand"). Most weapons use "mainhand".
The slot determines where the weapon appears in the equipment UI and which slot group it belongs to.

## Kind

Type: String

The damage type or category of the weapon (e.g., "slash", "pierce", "blunt", "fire", "ice").
Used for damage type interactions, resistances, and weapon categorization.
Affects how damage interacts with monster resistances and player bonuses.

## Material

Type: String or Object

The material ID or material object used in crafting this weapon.

# Quests

Quests represent progression milestones and advancement requirements.

Uses properties: [id](#id), [name](#name), [desc](#desc), [flavor](#flavor), [require](#require), [mod](#mod), [level](#level), [cost](#cost), [tags](#tags-property), [need](#need), [needtext](#needtext), [wizardtier](#wizardtier), [log](#log), [result](#result), [lock](#lock), [group](#group), [max](#max).

Quests are special progression items that unlock character advancement.
They typically have high costs and provide significant modifiers upon completion.
Used for tier progression and major character milestones.

## Wizardtier

Type: Boolean

Default Value: false

If `true`, indicates this quest is part of the wizard tier progression system.
Wizard tier quests unlock new character tiers and advancement levels.
Used to mark quests that are essential for character progression.

## Needtext

Type: String

Custom text displayed to the player when the item's `need` requirement is checked. The `needtext` bypasses the game's default parsing of the `need` property - instead of automatically generating text from the `need` condition, the game displays the custom `needtext` string directly. This allows for more user-friendly, descriptive text that explains why the item cannot be used/completed. The `needtext` is displayed in the UI whenever the `need` property is present, regardless of whether the condition is met or not. When the `need` condition is **not met**, the text is displayed in red. When the `need` condition **is met**, the text is still displayed but turns white, providing feedback that the requirement has been satisfied. Used for items where the default auto-generated text from `need` parsing would be unclear or insufficient for players to understand the requirement.

## Log

Type: Object

An object with `name` and `desc` properties that define a log entry created when the quest is completed.
Used for tracking completion and providing story context.
Similar to the `log` property for [dungeons](#dungeons).

# Clashes

Clashes are the type of combat focused on actively fighting a small number of powerful monsters. Clashes are all marked with the symbols ⚔💀. They are unreturnable; if you leave a clash for any reason, your progress will reset, unlike other types of adventures which keep your progress towards completion if you don't visit a different location. They have significant rewards and unlocks on first completion, with less focus on repeat clears. Typically, a clash's boss will challenge you with at least one unique mechanic, in addition to having good survivability and offense at the tier they're intended for.

Uses properties: Standard combat-related properties.

# Equipslots

Equipslots define equipment slot types that items can occupy.

Uses properties: [id](#id), [name](#name), [desc](#desc), [slotgroup](#slotgroup), [max](#max), [sortOrder](#sortOrder).

Equipslots define the different slots where equipment can be equipped (e.g., "mainhand", "head", "trinket").
Each slot can have restrictions on how many items can be equipped (via `max`).
Used by the equipment system to manage what can be equipped where.

## Slotgroup

Type: String

Equipment slot grouping identifier (e.g., `"equip"`).

# Potencies

Potencies are special stats that scale damage calculations.

Uses properties: [id](#id), [name](#name), [damage](#damage), [val](#val).

Potencies are stat-like items that define damage scaling formulas.
Each potency has a `damage` property containing a function string that calculates damage scaling based on the potency's value.
Used in attack and dot objects via the `potencies` array to scale damage based on these stats.

## Val

Type: Number

Default Value: 0

The initial value of the potency stat.
Sets the starting value for the potency, which affects damage scaling calculations.
Commonly set to `100` as a baseline for percentage-based scaling.

## Damage

Type: String

A function string that calculates damage scaling.
The function receives the potency's value (`i.value`) and returns a damage multiplier.
Example: `"Math.max((i.value/100)||0,0)"` scales damage based on potency value divided by 100.

# Hall

Hall represents the prestige/prestige system module structure.

Uses properties: Module structure with `module`, `sym`, and `data` properties containing events, glossaryentries, and other categories.

Hall is a special module format used for the prestige system.
It contains events, glossary entries, and other data specific to the wizard's hall prestige mechanic.
The hall module structure differs from standard modules and includes prestige-specific content.

**Note**: Hall uses a special module format with nested data structures. The `data` property contains categories like `events` and `glossaryentries` specific to the hall system. See [hall.json](../data/hall.json).

# Glossaryentries

Glossaryentries represent in-game documentation and help text.

Uses properties: [id](#id), [name](#name), [desc](#desc), [require](#require), [tags](#tags-property), [group](#group), [sym](#sym).

Glossaryentries provide in-game documentation and help text to players.
They can be unlocked via `require` conditions and are organized by `group` and `tags`.
The `desc` property can be an array of strings for multi-paragraph entries.
Used to explain game mechanics, systems, and features within the game.

# Deprecated items

## Professions

Professions represented character professions that provided modifiers.

Uses properties: [id](#id), [name](#name), [desc](#desc), [mod](#mod).

Professions are character choices that provide permanent modifiers.
They functioned similarly to classes but were typically simpler and focused on specific gameplay aspects. Professions modified game properties via their `mod` property.

**Note**: Deprecated.

## Places

Places represented location definitions with biome and locale information.

Uses properties: [id](#id), [name](#name), [biomes](#biomes), [loc](#loc), [homes](#homes), [locales](#locales).

Places defined geographic locations in the game world.

**Note**: Deprecated.

## Monsters

### Biome

Type: Array (`<String>`)

An array of biome names where the monster can spawn (e.g., `["swamp", "plains", "woods"]`).
Used for location-based monster spawning in locales and dungeons.
If not specified, the monster can spawn in any biome.

**Note**: Deprecated. Still present in some data but no longer used.

# Future

## Properties

Properties are modifiers applied to equipment during crafting or generation.

Uses properties: [id](#id), [name](#name), [level](#level), [tags](#tags-property), [alter](#alter).

Properties modify equipment when applied during crafting.
They use the [alter](#alter) property to define how they modify the final item.

**Note**: Not currently used.

# Reagents

Reagents are special resources used in crafting, spellcasting, or potion creation.

Uses properties: Same as [resources](#resources).

Reagents function identically to resources but are typically used for more specialized purposes.
They are stored and managed the same way as regular resources.

**Note**: Used in some places but not fully implemented. Do not use currently.
