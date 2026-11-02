DESKTOP SCALE (makes 100% browser zoom look like 90%)

1. Copy the "src" folder from this zip into the root of your project
   (Diving-Sanatan-), choosing "merge / replace" when asked.
   25 files are replaced. They were taken from your current GitHub main,
   so if you edited any of them since, use desktop-scale.patch instead.

2. Commit, push, and let your host redeploy.

To tune or turn it off, open src/app/globals.css, go to the very bottom and
change the number in:   --ui-zoom: 0.9;
   1    = off (back to normal)
   0.85 = even smaller
   0.95 = slightly smaller

It only applies to desktop screens (1200px+ wide with a mouse). Phones and
tablets are not changed.
