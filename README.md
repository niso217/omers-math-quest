# Omer's Math Quest — The Lost Melody

A Hebrew, right-to-left browser adventure built on Omer's original math game. Explore nine regions, help their inhabitants, solve environmental math puzzles, and recover the nine notes of a lost melody.

## Play locally

Requires Python 3. No install or build step is needed.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Serve the files over HTTP; browser modules and question-bank loading do not work by double-clicking `index.html`.

## Controls

- Click/tap the ground to walk, or use arrow keys / WASD.
- Click a labeled place to walk there and interact. Near an object, use E, Space, or the action button.
- The quest-journal button walks directly to the next objective. On touch devices, directional buttons are also available.
- Music is optional and starts only after interaction. Escape closes dialogs and preserves the current challenge.

## What changed

- A walkable, illustrated world with collision, pathfinding, companions, optional treasure, and a bridge that becomes traversable when repaired.
- Nine story chapters using the original nine question banks. Each main objective combines two interactive/generated questions with one question from the existing bank. Treasure uses existing questions too.
- Code locks, number sequences, equal-group fireflies, fraction crystals, arithmetic, missing numbers, multistep stories, and area/perimeter puzzles.
- Mistakes give hints and retries. There is no life lockout or time pressure. Parent progress separates independent answers from answers reached with help.
- Collectible notes, earned cosmetic cloaks, persistent checkpoints, and revisitable regions. Rewards are granted once per objective/chapter.

## Saves and compatibility

Progress uses `omerMathQuestAdventure.v2` in localStorage. On first load, coins, unlocked chapters and purchased themes migrate from `omerMathQuestState`; the original save is left untouched. A partially completed original quiz restarts as a quest in its unlocked chapter. Progress is local to the browser and origin; there is no account, analytics or cloud sync.

The parent panel offers a JSON backup. To restore a backup manually, its `state` object must be stored under `omerMathQuestAdventure.v2` on the same browser origin. A restore UI is not included.

`config.json` still supplies the player name, title and base difficulty. The original `generate_json.py`, `admin_dashboard.py`, question JSONs, and their workflow remain available. The adventure has nine authored chapters; the old `totalLevels` and heart/theme shop prices do not configure the new story or wardrobe.

## Checks

Node.js 20+ is needed only for the tests:

```sh
npm test
```

Tests cover save migration/checkpoints, answer parsing, learning statistics, reward duplication, shop transactions, all 900 original questions, generated math invariants, and paths across the repaired bridge.

## Files

- `script.js`: UI, dialogs, quest orchestration, saves, question-bank loading.
- `game-core.js`: testable math generation, progression, migration, collision and pathfinding.
- `quest-content.js`: Hebrew story, chapter metadata and cosmetics.
- `world.js`: responsive canvas world, original vector artwork and movement.
- `sound.js`: optional synthesized ambient music and feedback sounds.
- `index.html` / `style.css`: responsive application shell and puzzle interfaces.

Artwork and audio are generated locally. The optional Heebo font is loaded from Google Fonts; system fonts work if it is unavailable. No external game engine or runtime package is required.
