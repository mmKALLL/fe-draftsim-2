For the assets, put the game-ready copies next to the HTML file using this folder structure:

FE draftsim roguelike prototype 1-shot.html
assets/
  femp/
    portraits/
      lyn.png
      eliwood.png
      hector.png
      larachel.png
    enemy-portraits/
      generic.png
      myrm.png
      cavalier.png
      cavalier_promoted.png
    boss-portraits/
      lloyd.png
      valter.png
      riev.png
    map/
      blue/
        lord.png
        lord_promoted.png
        merc.png
      red/
        lord.png
        lord_promoted.png
        merc.png

The prototype checks these paths for side-panel portraits:

./assets/femp/portraits/<character>.png
./assets/femp/portraits/<character>.gif
./assets/femp/portraits/<character>.webp

Portraits should be cropped to the top-left portrait rectangle from the standard mug sheet. For the vanilla 128x112 sheets in this project, that means a 96x80 crop from x=0, y=0. The UI preserves proportions and zooms them to cover the portrait slot height.

Enemy side-panel portraits use class-based files instead of character-name files:

./assets/femp/enemy-portraits/<class>.png
./assets/femp/enemy-portraits/<class>.gif
./assets/femp/enemy-portraits/<class>.webp

If a promoted enemy file is missing, the UI falls back to the base class enemy portrait, then to enemy-portraits/generic, then to the generated placeholder. It does not fall back to the player character portrait.

Named bosses check this folder first:

./assets/femp/boss-portraits/<boss-name>.png
./assets/femp/boss-portraits/<boss-name>.gif
./assets/femp/boss-portraits/<boss-name>.webp

If a real boss portrait is missing, the UI falls back to the class-based enemy portrait path above.

The center combat area checks these paths for animated map sprite sheets:

./assets/femp/map/blue/<class>.png
./assets/femp/map/blue/<class>.gif
./assets/femp/map/blue/<class>.webp

./assets/femp/map/red/<class>.png
./assets/femp/map/red/<class>.gif
./assets/femp/map/red/<class>.webp

Names are expected to be lowercase and simplified. The code converts character names to lowercase slugs, so:

L'Arachel or L’Arachel -> larachel
Eliwood -> eliwood
Matthew -> matthew

The HTML is the source of truth for class stems. Current map sprite stems are:

lord
lord_promoted
merc
merc_promoted
myrm
myrm_promoted
knight
knight_promoted
cavalier
cavalier_promoted
pega
pega_promoted
wyvern
wyvern_promoted
fighter
fighter_promoted
archer
archer_promoted
mage
mage_promoted
monk
monk_promoted
cleric
cleric_promoted
shaman
shaman_promoted

Map sprites should be normalized vertical stand sheets with three 16x20 visible frames stacked top-to-bottom, so each file is 16x60 sprite pixels. Regular 16x16 source frames should be vertically centered with two transparent pixels above and below each frame. Taller 16x32 source frames should use their bottom 20 pixels, clipped from the top. The browser renders all sheets at the same 4x pixel scale, so each visible map slot is 64x80 CSS pixels and never peeks into neighboring frames.

File systems differ on case sensitivity. To be safe, use all-lowercase filenames exactly like lyn.png, pega.png, and myrm_promoted.png. On many hosted/Linux environments, Lyn.png and lyn.png are different files.
