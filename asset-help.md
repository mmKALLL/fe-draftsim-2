For the assets, put them next to the HTML file using this folder structure:

fe7_roguelike_prototype_no_scope_header.html
assets/
  femp/
    portraits/
      lyn.png
      eliwood.png
      hector.png
      larachel.png
    battle/
      myrm.png
      cavalier.gif
      pega.png
      fighter.png
      mage.png

The prototype checks these paths:

./assets/femp/portraits/<character>.png
./assets/femp/portraits/<character>.gif
./assets/femp/portraits/<character>.webp

./assets/femp/battle/<class>.png
./assets/femp/battle/<class>.gif
./assets/femp/battle/<class>.webp

Names are effectively expected to be lowercase and simplified. The code converts character names to lowercase slugs, so:

L'Arachel → larachel
Eliwood → eliwood
Matthew → matthew

Class battle sprite stems currently use abbreviations like:

myrm
merc
thief
cavalier
knight
pega
wyvern
fighter
brigand
archer
mage
cleric
shaman

File systems differ on case sensitivity. To be safe, use all-lowercase filenames exactly like lyn.png, pega.gif, myrm.png. On many hosted/Linux environments, Lyn.png and lyn.png are different files.
