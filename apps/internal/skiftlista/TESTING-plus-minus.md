# Click-through guide: more or fewer places on a shift (plus and minus)

What is new: under the places of every shift there is a line like "Skjenker: 2" with a "−" button and a "+" button. "+" adds one place. "−" takes away one EMPTY place. A person is never taken off by "−".

The guide has two parts. Part A uses invented people and saves nothing, so you cannot break anything. Part B uses Personal's demo database and saves your changes (every change is undone by the next step).

For each step: do it, compare with "You should see", and tick the box. If something is different, write what you did, what you expected and what you saw.

## Part A: invented data (nothing is saved)

### A1. Start the page

Do this:

1. Open an Ubuntu window (Windows key, type Ubuntu, Enter).
2. Type this and press Enter:

       cd ~/kvarteret/samfunnetibergen

3. Type this and press Enter:

       npm run dev:skiftlista

4. Wait until you see "Local: http://localhost:3190/". Leave the window open.
5. In Chrome open: http://localhost:3190

You should see:

- The page with "Uke 49" and a grid of shifts.
- If the window says "Port 3190 is already in use", the page is already running. That is fine, go on.

- [ ] It matched

### A2. Add a place with "+"

Press F5 first.

Do this:

1. Find the column Torsdag and the row Dagskift. Under its places, find the line "Skjenker: <number>". Write down the number.
2. Click the "+" button on that line.

You should see:

- A green message "Ny plass som skjenker, ...".
- The number is one higher, and there is one more Skjenker place that says Ledig.
- The thick coloured frame stays on the "+" button, so you can press Enter again to add another.

- [ ] It matched

### A3. Undo

Do this:

1. Press Ctrl and Z at the same time.

You should see:

- A message that the place is removed, and the number is back to what you wrote down.

- [ ] It matched

### A4. Take places away with "−", all the way to zero

Do this:

1. Click the "−" button on the same line, again and again, until the number is 0.
2. Click "+" once.

You should see:

- Each "−" removes one Ledig place. At 0 the line is still there, with "+" and a dimmed "−".
- After "+" there is one Skjenker place again.

- [ ] It matched

### A5. "−" never removes a person

Press F5 first.

Do this:

1. In the box on the right click "Uten skift", then click "Emil T.".
2. Click one of the Skjenker places on Torsdag Dagskift that says "Sett inn Emil".
3. Click "−" on the line "Skjenker" on that shift until nothing more happens.

You should see:

- Emil is on a place. "−" removes the empty places only.
- When only Emil's place is left, "−" is dimmed and clicking it does nothing. Emil stays.

- [ ] It matched

### A6. No plus or minus for Skiftleder

Do this:

1. Look at the lines under the places on a shift.
2. Click a Skiftleder place and look at the box on the right.

You should see:

- The only line is "Skjenker" (in the kitchen it would say "Kokk"). There is no line for Skiftleder and none for Opplæring.
- The box on the right has no button that removes the place. Every shift has exactly one skiftleder place, and training is a mode of a place, not a kind of place.

- [ ] It matched

### A7. Keyboard only

Press F5 first.

Do this:

1. Press Tab until you are on a "+" button. The screen reader name (if you have one on) is "Flere skjenker, torsdag ..." for "+", and "Færre skjenker, torsdag ..." for "−".
2. Press Enter twice.
3. Press Shift and Tab once to reach "−", and press Enter.
4. Press Ctrl and Z three times.

You should see:

- The frame is on the button after each press, and the numbers go up twice, down once, and then back to the start.

- [ ] It matched

### A8. Print

Do this:

1. Press Ctrl and P, look at the preview, and click Cancel.

You should see:

- The grid and the names, but no "−" and no "+".

- [ ] It matched

### A9. When you are finished with Part A

Click in the Ubuntu window and press Ctrl and C. (If the page was started by someone else, skip this.)

- [ ] Done

## Part B: real demo data from Personal (changes are saved)

Do Part B only with the bar Stjerne and week 47. The changes are in Personal's demo database, and each step undoes itself.

### B1. Start everything

You need three Ubuntu windows. If a window says "address already in use", that program is already running: leave it.

Window 1. Type and press Enter:

    cd ~/kvarteret && ./start-personal.sh

Wait for "Application startup complete".

Window 2 (open a new Ubuntu window). Type and press Enter:

    cd ~/kvarteret/kvarteret-personal && uv run uvicorn app.main:create_app --factory --port 8002

Wait for "Application startup complete".

Window 3 (open a new Ubuntu window). Type and press Enter:

    cd ~/kvarteret/samfunnetibergen && npm run dev:skiftlista

Wait for "Local: http://localhost:3190/".

You should see:

- Three windows, each with its "started" message.

- [ ] It matched

### B2. Log in and open the week

Do this:

1. In Chrome open: http://localhost:8002/login
2. Type dev@kvarteret.dev in the first field and dev-password in the second. Click the login button.
3. In Chrome open: http://localhost:3190/?api=http&bar=7&uke=2026-11-16

You should see:

- Step 2: Personal's front page, logged in as Dev Admin.
- Step 3: the page with the bars at the top, "Stjerne" selected, "Uke 47", and at the bottom "Leser fra og lagrer i Personal."
- Under the places of each shift the line "Skjenker: <number>" with "−" and "+".

- [ ] It matched

### B3. Add a place and undo

Do this:

1. Look at the round button "ledige" at the top and write the number down.
2. Click "+" on the line "Skjenker" of any shift.
3. Press Ctrl and Z.

You should see:

- Step 2: "Ny plass som skjenker, ..." and the number on that line goes up by one. The "ledige" number goes up by one too.
- Step 3: the place is gone and both numbers are back.

- [ ] It matched

### B4. "−" on a shift where every Skjenker place has a person

Do this:

1. Find a shift where the Skjenker places all have names.
2. Look at the "−" button on its line. Try to click it.

You should see:

- "−" is dimmed and nothing happens. Nobody is taken off.

- [ ] It matched

### B5. Two leaders at once

Do this:

1. Open the same address from B2 step 3 in a second Chrome tab. Call the first tab 1 and the second tab 2.
2. In tab 1 click "+" on any Skjenker line.
3. In tab 2, without reloading, click "+" on any Skjenker line.
4. In tab 2 click "+" once more.
5. In tab 1 press Ctrl and Z, and in tab 2 reload (F5) and look at the numbers.

You should see:

- Step 3: a red message "En annen leder har endret uka. Siden er oppdatert, prøv igjen." Nothing is added, and tab 2 now shows the place tab 1 added.
- Step 4: this time it works.
- Step 5: the data is as before the test.

- [ ] It matched

### B6. Clean-up check

Do this:

1. Reload the page (F5) and compare the numbers on the lines with what you saw in B2.

You should see:

- The same numbers as in B2. If a number is different, one of the steps was not undone: write down which shift, and use "−" (an empty place) or "+" to put it right.

- [ ] It matched

### B7. When you are finished

Click in each of the three Ubuntu windows and press Ctrl and C. (Only the windows you started yourself.)

- [ ] Done

## Optional: the automatic checks

These run the same checks the computer runs on its own. Type each command on its own, one at a time.

    cd ~/kvarteret/samfunnetibergen

    npm run typecheck:skiftlista

You should see: the last line says 0 ERRORS 0 WARNINGS.

    npm run test:skiftlista

You should see: Tests 44 passed (44).

    cd ~/kvarteret/samfunnetibergen/apps/internal/skiftlista

    export LD_LIBRARY_PATH=~/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu

    npx playwright test

You should see: 59 passed.
