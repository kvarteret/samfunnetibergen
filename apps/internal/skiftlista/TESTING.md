# Skiftlista testguide

This guide shows you, step by step, how to check that the new Skiftlista leader page works. You do not need to know how to program. You will type a few commands that are written out for you, and then click around in the page and compare what you see with the pictures.

It takes about 30 minutes. The page uses invented people, nothing you do is saved, and you cannot break anything.

A version of this guide with pictures of what each step should look like, tick boxes and a "Copy my results" button is shared as a page by Morten. This file has the same steps as text.

## Words you will see

- **Ledig**: a free place on a shift
- **Skiftleder / SL**: shift leader
- **Skjenker**: bartender
- **vil / kan / kan ikke / ikke svart**: the person's answer for that shift: wants to / can if needed / cannot / has not answered
- **Sett inn**: put this person here
- **Angre**: undo
- **Publiser uka**: publish the week, so people see their shifts in the app
- **Folk denne uka**: the list of people on the right

## Part 1: Start the page

The page runs on your own computer. You start it from a window called Ubuntu, where you type commands, and then you look at it in Chrome.

Type each command exactly as written, one at a time, and press Enter after each. Tip: you can copy a command from this guide and paste it into the Ubuntu window with a right click.

### 1.1 Open the Ubuntu window

Do this:

1. Press the Windows key, type Ubuntu, and press Enter.

You should see:

- A black window opens with a line that ends with a $ sign. This is where you type commands.

- [ ] It matched

### 1.2 Go to the project folder

Do this:

1. Type this command and press Enter:

       cd ~/kvarteret/samfunnetibergen


You should see:

- Nothing much happens, but the line now ends with samfunnetibergen$.
- If it says "No such file or directory", the project is somewhere else on this computer. Ask Morten.

- [ ] It matched

### 1.3 Start the page

Do this:

1. Type this command and press Enter:

       npm run dev:skiftlista

2. Wait about 5 seconds.

You should see:

- You see the word VITE and a line saying Local: http://localhost:3190/
- Leave this window open. Closing it stops the page.
- If it says "Port 3190 is already in use" and stops, the page is already running somewhere else, usually started by Claude Code. That is fine: go to 1.4. But then step 1.5 will not stop it; it stops when that Claude Code session is closed.
- If it shows an error with words like "not found" or "Cannot find module", type the command below, press Enter, wait until it finishes (a few minutes), and then do 1.3 again:

       npm ci


- [ ] It matched

### 1.4 Open the page in Chrome

Do this:

1. Open Chrome (or Edge).
2. Click in the address bar at the top, type localhost:3190 and press Enter.

You should see:

- You see the page in the picture below: "Skiftlista" in red at the top left, a big "Uke 49", a grid of shifts, and a list of people on the right.
- If Chrome says it cannot reach the page, check that the Ubuntu window from 1.3 is still open and shows Local: http://localhost:3190/.

- [ ] It matched

### 1.5 When you are finished (do this at the very end)

Do this:

1. Click in the Ubuntu window and press Ctrl and C at the same time.

You should see:

- The line ending with $ comes back, and if you reload Chrome (F5) it says the page cannot be reached. You can close the Ubuntu window.
- If Chrome still shows the page, it was started somewhere else (see 1.3). That is not a problem with the page.

- [ ] It matched

## Part 2: Try it with the mouse

Before each test, press F5 on the keyboard. That reloads the page and puts everything back to the start, so each test begins the same way.

For each test: do the steps, compare with "You should see", and tick the box if it matched. If something was different, write a short note in the box under the test.

### 2.1 First look

Press F5 first, to start from the beginning.

Do this:

1. Just look at the page.

You should see:

- The big title says "Uke 49", with a yellow label "Utkast: ikke synlig i appen" next to it.
- Below it are four round buttons: "! 1 problem" (red), "7 advarsler", "12 ledige" and "4 uten skift".
- On the right is a box called "Folk denne uka" with a list of names. Under each name is a short line, for example "1 uka · 2 mnd · 6 t": shifts this week, shifts this month, and planned hours this week (people with no shift this week show no hours).
- The colours and letters look like the samfunnetibergen.no website.

- [ ] It matched

### 2.2 Put a person on a shift

Press F5 first, to start from the beginning.

Do this:

1. In the box on the right, click the round button "Uten skift".
2. Click the name "Emil T." in the list.

You should see:

- Emil's row turns orange.
- Several free places in the grid now say "Sett inn Emil" with an orange dashed border.
- The free Skiftleder places also say "Sett inn Emil", but with a red line "bare godkjente skiftledere" and "Krever bekreftelse", because Emil is not an approved shift leader. A leader may still place him, after confirming (test 2.20).

- [ ] It matched

### 2.3 ...and place him

Do this:

1. Continue from 2.2. Click one of the places that says "Sett inn Emil".

You should see:

- A green message appears: "Emil T. er satt opp som skjenker, ...".
- The place now shows "Emil T.".
- Some places show a warning in yellow or red, for example "svarte kan ikke" (he answered that he cannot). That is expected: the page warns but still lets the leader decide.

- [ ] It matched

### 2.4 Undo

Do this:

1. Continue from 2.3. Click the button "Angre Emil T. satt inn" near the top right. (Or press Ctrl and Z at the same time.)

You should see:

- The message changes to "Emil T. er tatt av ...".
- The place says "Sett inn Emil" again.

- [ ] It matched

### 2.5 Start from a free place

Press F5 first, to start from the beginning.

Do this:

1. In the grid, find the column Torsdag (Thursday) and the row Dagskift. Click the top place there: it says SKIFTLEDER and Ledig.

You should see:

- The box on the right changes. Its title is "Skiftleder, torsdag 3. desember".
- It lists people under the headings Vil, Kan, Ikke svart and Kan ikke.
- The names under Vil, Kan, Ikke svart and Kan ikke all end with "· SL" (approved shift leaders).
- Last in the box is a heading "Uten godkjenning, krever bekreftelse" with the other people. They can be chosen too, but only after a popup (test 2.20).

- [ ] It matched

### 2.6 ...and pick someone

Do this:

1. Continue from 2.5. Click "Iver K." in the box on the right.

You should see:

- A green message says Iver K. is placed.
- The box on the right goes back to the list of people, and the place shows "Iver K.".

- [ ] It matched

### 2.7 Remove a person

Press F5 first, to start from the beginning.

Do this:

1. Click "Kari B." in the grid (column Onsdag, the place with a red border).
2. In the box on the right, click "Fjern Kari B.".

You should see:

- A green message says "Kari B. er tatt av ...".
- The red round button "! 1 problem" at the top disappears.

- [ ] It matched

### 2.8 Move a person

Press F5 first, to start from the beginning.

Do this:

1. Click "Ingrid V." in the grid (column Tirsdag, row Dagskift).
2. In the box on the right, click "Flytt eller bytt".

You should see:

- An orange box appears: "Velg en ledig plass å flytte til ...".
- Free places now say "Flytt hit", and filled places say "Bytt med ...".

- [ ] It matched

### 2.9 ...finish the move, then undo it

Do this:

1. Continue from 2.8. Click a place that says "Flytt hit".
2. Then press Ctrl and Z at the same time.

You should see:

- First a green message "Ingrid V. er flyttet til ...".
- After Ctrl+Z, Ingrid V. is back on Tirsdag.

- [ ] It matched

### 2.10 Swap two people

Press F5 first, to start from the beginning.

Do this:

1. Click "Even M." (column Mandag, row Dagskift, the Skiftleder place).
2. Click "Flytt eller bytt".
3. Click "Bytt med Jonas" (column Tirsdag, row Dagskift, the Skiftleder place).

You should see:

- A green message: "Even M. og Jonas L. har byttet plass."
- Even M. is now on Tirsdag and Jonas L. on Mandag.

- [ ] It matched

### 2.11 Drag and drop

Press F5 first, to start from the beginning.

Do this:

1. Click "Uten skift" in the box on the right.
2. Press and hold the mouse button on "Emil T.", drag him onto a free Skjenker place in the column Torsdag, and let go.

You should see:

- A green message says Emil T. is placed.
- Also try: drag a person who is already in the grid onto a free place (they move), or onto another person (they swap).

- [ ] It matched

### 2.12 See who can work on one day

Press F5 first, to start from the beginning.

Do this:

1. Click the word "Mandag" at the top of the grid.

You should see:

- The Mandag header turns orange.
- The box on the right says "Sortert etter svar for mandag 30. november" and each person shows their answer for that day.
- Click "Fjern dag" to go back.

- [ ] It matched

### 2.13 The round buttons with numbers

Press F5 first, to start from the beginning.

Do this:

1. Click "! 1 problem". Then click the X in the box on the right.
2. Click "12 ledige". Then click the X.
3. Click "4 uten skift".

You should see:

- "! 1 problem" opens Kari B.'s place in the box on the right.
- "12 ledige" opens the first free place.
- "4 uten skift" selects a person (their row turns orange).

- [ ] It matched

### 2.14 Publish the week

Press F5 first, to start from the beginning.

Do this:

1. Click the red button "Publiser uka".

You should see:

- The label next to "Uke 49" changes to "Publisert" (green).
- The round week button shows "49 ✓".
- The red button changes to "Gjør til utkast".

- [ ] It matched

### 2.15 ...then change something

Do this:

1. Continue from 2.14. Put Emil T. on a place, as in 2.2 and 2.3.

You should see:

- The label changes to "Endret etter publisering" (yellow).
- The dashed box under the title says "Uka er endret etter publisering." and ends with "Sist endret av Dev Admin, kl. HH:MM." (the time is the minute you made the change).

- [ ] It matched

### 2.16 Another bar and other weeks

Press F5 first, to start from the beginning.

Do this:

1. Click "Grøndahls" at the very top.
2. Click the arrow > to the right of the round week buttons.
3. Click the round button "49".

You should see:

- Grøndahls has one row called Pub, and Lørdag (Saturday) has places too.
- The arrow shows "Uke 50".
- "49" takes you back to "Uke 49".

- [ ] It matched

### 2.17 Search and filters

Press F5 first, to start from the beginning.

Do this:

1. Click in the box "Søk etter navn" and type: ada
2. Delete what you typed.
3. Click the round button "Skiftledere".

You should see:

- While "ada" is typed, only "Ada B." is in the list.
- With "Skiftledere", the list shows 5 people and the text "Viser 5 av 16".

- [ ] It matched

### 2.18 Someone is sick

Press F5 first, to start from the beginning.

Do this:

1. Find the column Mandag, row Dagskift, the Skjenker place. It has a red dashed border and says "Sara H." and "Kan ikke i dag, trenger erstatter". Click it.
2. Click any name in the box on the right.

You should see:

- In the grid, before you click: you can see at once that Sara H. had this shift but cannot come, and that the place needs someone else.
- Before you pick: the box on the right says "Sara H. har meldt kan ikke i dag. Den du velger tar plassen, og Sara H. tas av."
- After you pick: the person you chose is on the place, and the red note about Sara H. is gone.

- [ ] It matched

### 2.19 The banner for a week that is not published

Press F5 first, to start from the beginning.

Do this:

1. Look just below the big title "Uke 49" and the week buttons.
2. Click the red button "Publiser uka".
3. Click the button "Uten skift", click "Emil T.", and then click one of the places that says "Sett inn Emil". (This is a change after publishing, like in 2.15.)
4. Click "Publiser uka" once more.

You should see:

- In step 1: a box with a dashed border and the text "Uka er ikke publisert. Folk ser ikke skiftene sine i appen før du trykker «Publiser uka»."
- In step 2: the box is gone, and the label next to "Uke 49" says "Publisert".
- In step 3: the box is back, now yellow, with the text "Uka er endret etter publisering. Trykk «Publiser uka» igjen når du er ferdig med endringene."
- In step 4: the box is gone again.
- The banner is not on the paper if you print (Ctrl and P): see 4.3.

- [ ] It matched

### 2.20 Place someone who is not approved (the popup)

A leader may place anyone, also a person who does not have the approval the place needs. The page then asks first, with a big warning.

Press F5 first, to start from the beginning.

Do this:

1. Click "Uten skift" in the box on the right, and click "Emil T.".
2. In the grid, find the column Torsdag, row Dagskift, and click the top place (Skiftleder). It says "Sett inn Emil", a red line "bare godkjente skiftledere", and "Krever bekreftelse".
3. Look at the popup. Then click "Avbryt".
4. Click the same place again. This time click "Sett inn likevel".
5. Press Ctrl and Z at the same time.
6. Select Emil again, click the same place, and when the popup appears press Esc.

You should see:

- Step 3: a popup in the middle of the page with a red border and the title "Sette inn Emil likevel?". It says Emil does not have what is needed for this place, with the red line "bare godkjente skiftledere". The grey page behind cannot be clicked. The thick coloured frame is on the button "Avbryt" (so pressing Enter by mistake does not confirm).
- After "Avbryt": the popup goes away, nothing is placed, and the frame is back on the place.
- Step 4: the popup goes away, a green message says "Emil T. er satt opp som skiftleder ...", and the place shows "Emil T.".
- Step 5: Emil is taken off again ("Emil T. er tatt av ...").
- Step 6: Esc closes the popup like "Avbryt".
- Also try: click the Skiftleder place with nobody selected, scroll the box on the right, and click a name under "Uten godkjenning, krever bekreftelse". The same popup appears.

- [ ] It matched

### 2.21 More or fewer places on a shift (plus and minus)

Sometimes a shift needs one more person ("this Thursday will be busy", "a trainee wants to join"), or one place too many. Under the places of every shift there is a line "Skjenker: 2" with a "−" and a "+" button.

Press F5 first, to start from the beginning.

Do this:

1. Find the column Torsdag, row Dagskift. Under its places, click "+" on the line "Skjenker".
2. Press Ctrl and Z at the same time.
3. Click "−" on the same line until the number is 0.
4. Click "+" once.
5. Click "Emil T." in the list (after "Uten skift"), then click one of the Skjenker places on Torsdag Dagskift so Emil is on it. Click "−" until it stops working.
6. Click the Skiftleder place on Torsdag Dagskift and look at the box on the right. Look under the places of the shift: is there a line with "−" and "+" for Skiftleder?
7. Press Ctrl and P, look at the preview, and cancel.

You should see:

- Step 1: a green message "Ny plass som skjenker, ...", the number goes up by one, and Torsdag Dagskift has one more Skjenker place that says Ledig. The thick coloured frame stays on "+".
- Step 2: the message says the place is removed, and the extra place is gone again.
- Step 3: each click removes one empty place. At 0 the line is still there, with "+" and a dimmed "−".
- Step 4: one Skjenker place is back.
- Step 5: "−" removes only the empty places. Emil's place stays, "−" becomes dimmed and nothing happens when it is pressed. A person is never taken off by "−"; first take the person off, then the place can be removed.
- Step 6: there is no "−" or "+" for Skiftleder, and the box on the right has no remove-place button. Every shift has exactly one skiftleder place. There is none for Opplæring either: training is a mode of a place, not a kind of place.
- Step 7: the lines with "−" and "+" are not on the paper.
- In the kitchen the line says "Kokk" instead of "Skjenker".

- [ ] It matched

## Part 3: Try it without a mouse

Some leaders use only the keyboard. Put the mouse aside for these tests.

Keys you need: Tab moves to the next thing, Shift and Tab together move back, Enter presses the thing you are on, Esc steps back.

It is normal to press Tab many times: the grid has many places.

### 3.1 You can always see where you are

Press F5 first, to start from the beginning.

Do this:

1. Press Tab once, then keep pressing Tab slowly.

You should see:

- After the first Tab, a box "Gå til folk" appears at the top left.
- As you keep pressing Tab, a thick coloured frame always shows which button or place you are on.
- If the frame ever disappears or you cannot tell where you are, write down where it happened.

- [ ] It matched

### 3.2 Place a person with the keyboard

Press F5 first, to start from the beginning.

Do this:

1. Press Tab until you reach the round button "Uten skift" in the box on the right, and press Enter.
2. Press Tab until you reach "Emil T.", and press Enter.
3. Press Shift and Tab together (going backwards) until you reach a place in the grid that says "Sett inn Emil", and press Enter.

You should see:

- The green message says Emil T. is placed.
- The coloured frame is now on the place where Emil was put.

- [ ] It matched

### 3.3 Undo with the keyboard

Do this:

1. Continue from 3.2. Press Ctrl and Z at the same time.

You should see:

- The message says Emil T. is taken off again.

- [ ] It matched

### 3.4 Open and close a place

Press F5 first, to start from the beginning.

Do this:

1. Press Tab until you are on any place in the grid that says Ledig, and press Enter.
2. Press Esc.

You should see:

- After Enter: the box on the right shows that place.
- After Esc: the box goes back to the list of people, and the coloured frame is back on the same place in the grid.

- [ ] It matched

## Part 4: Small screens, zoom and printing

### 4.1 A narrow window

Press F5 first, to start from the beginning.

Do this:

1. If Chrome fills the whole screen, click the middle square button at the top right of the window so it gets smaller.
2. Drag the right edge of the Chrome window to the left until the window is about as narrow as a phone.

You should see:

- The box "Folk denne uka" moves down below the grid. (This happens when the window is less than about 1280 pixels wide, or when you zoom in. On a laptop with the Windows display scale at 125 percent or more, you may see this layout even with the window full size.)
- The grid can be scrolled sideways inside its own frame, but the page itself does not move sideways.
- Nothing is cut off so you cannot read it.

- [ ] It matched

### 4.2 Zoom to 200%

Press F5 first, to start from the beginning.

Do this:

1. Make the window normal size again.
2. Hold Ctrl and press + several times, until the address bar shows 200%.
3. When you are done, press Ctrl and 0 (zero) to go back to normal.

You should see:

- Everything is bigger and still readable. Nothing overlaps or is cut off.

- [ ] It matched

### 4.3 Print

Press F5 first, to start from the beginning.

Do this:

1. Press Ctrl and P at the same time. A print preview opens.
2. Look at the preview, then click Cancel. (You do not need to print.)

You should see:

- The preview shows the title and the grid with names.
- It does not show the buttons or the box on the right.
- All seven days fit on the paper, Mandag to Søndag, and the paper is turned sideways (landscape).

- [ ] It matched

### 4.4 A place on a narrow screen (the sheet)

On a narrow window, a place does not open in the box on the right (it has moved down below the grid, and you would have to scroll to find it). Instead it opens in a panel that slides up over the page, called a sheet.

Press F5 first, to start from the beginning.

Do this:

1. Make the window narrow as in 4.1 (or zoom in with Ctrl and + as in 4.2, until the people box has moved below the grid).
2. Scroll the grid sideways, find any place that says Ledig, and click it.
3. Look at the sheet. Then press Esc.
4. Click the same place again. Click a name in the sheet.
5. Click a place that already has a person (for example "Ingrid V." on Tirsdag), then click "Flytt eller bytt" in the sheet.
6. Press Esc to cancel the move. Click a Ledig place again, then click once on the dimmed page above the sheet.
7. Make the window wide again (or press Ctrl and 0), and click a Ledig place.

You should see:

- Step 2: a panel appears at the bottom of the window, with the rest of the page dimmed behind it. Its title is for example "Skiftleder, torsdag 3. desember", and under it are the lists Vil, Kan, Ikke svart and Kan ikke. There is an X button in the top right corner of the panel.
- Step 3: the sheet goes away, and the thick coloured frame is back on the place you clicked.
- Step 4: the sheet goes away by itself, a green message says the person is placed, and the place now shows the name.
- Step 5: the sheet goes away and the orange box "Velg en ledig plass å flytte til ..." appears, so you can click where to move.
- Step 6: Esc cancels the move. The sheet goes away when you click the dimmed page.
- Step 7: on a wide window there is no sheet and no dimming: the place opens in the box on the right, as in 2.5.
- While the sheet is open, pressing Tab again and again never goes to the grid behind it; it keeps cycling inside the sheet.

- [ ] It matched

## Part 5 (optional): Listen with a screen reader

Blind and partially sighted people use a screen reader, a program that reads the screen aloud. This part takes extra time. Skip it if you do not have time or headphones.

### 5.1 Install and start NVDA

Do this:

1. In Chrome, open the address nvaccess.org/download and download NVDA (it is free). Install it.
2. Start NVDA by pressing Ctrl, Alt and N at the same time. It starts talking.
3. To stop NVDA later: press Insert and Q at the same time, then Enter.

You should see:

- NVDA says something when it starts.

- [ ] It matched

### 5.2 Listen to the grid

Press F5 first, to start from the beginning.

Do this:

1. Go to the Skiftlista page and press F5.
2. Press Tab until you are on a place in the grid, and listen.

You should see:

- It reads the role, the day with the full month, the shift, the person and any problem, something like: "Skiftleder mandag 30. november, Dagskift. Even M. svar: vil. Problem: 3 skift denne uka".
- If the voice sounds strange or English, NVDA is reading Norwegian text with an English voice. See 5.4.

- [ ] It matched

### 5.3 Hear the result of an action

Do this:

1. Do test 3.2 again (place Emil with the keyboard) while NVDA is running.

You should see:

- NVDA reads the green message by itself, without you moving to it.

- [ ] It matched

### 5.4 (If needed) Use a Norwegian voice

Do this:

1. First add a Norwegian voice to Windows: open Settings, then Time & language, then Speech. Under Manage voices, click Add voices, choose Norsk (bokmål), and click Add. Wait until it is installed.
2. Then in NVDA: press Insert and N together, choose Preferences, then Settings, then Speech. Next to Synthesizer, click Change and choose Windows OneCore voices. Click OK.
3. Next to Voice, choose the Norwegian voice (for example Microsoft Jon). Click OK.

You should see:

- Do 5.2 again. The Norwegian words now sound natural.

- [ ] It matched

## Part 7 (optional): See real demo data from Personal

Until now the page used invented people that live only in the browser. Here the page reads the week from Personal (a separate system), through the same login Personal already has. The people and shifts are Personal's demo data, not real people. Part 7 is for looking; Part 8 changes the week, and the changes are saved in Personal's demo database (every change can be undone with Ctrl and Z).

You need three Ubuntu windows. If you started the page in 1.3, stop it first (Ctrl and C in that window).

### 7.1 Start Personal and the page

Do this:

1. In the first Ubuntu window, type and press Enter:

       cd ~/kvarteret && ./start-personal.sh

   Wait until you see "Application startup complete". Leave the window open.

2. Open a second Ubuntu window (press the Windows key, type Ubuntu, Enter). Type and press Enter:

       cd ~/kvarteret/kvarteret-personal && uv run uvicorn app.main:create_app --factory --port 8002

   Wait for "Application startup complete". Leave it open.

3. Open a third Ubuntu window. Type and press Enter:

       cd ~/kvarteret/samfunnetibergen && npm run dev:skiftlista

   Wait for "Local: http://localhost:3190/".

You should see:

- Three windows, each ending its text with a "started" or "Local:" message.
- If a window says "address already in use", that program is already running (Claude Code may have started it). That is fine: leave it and go on to 7.2. Press Ctrl and C only in windows you started yourself.
- Why two copies of Personal: Chrome on this computer cannot open port 8000, but the page itself can talk to it. So you log in on port 8002 and the page reads from port 8000. They share the same database and the same login.

- [ ] It matched

### 7.2 Log in to Personal

Do this:

1. In Chrome, open: http://localhost:8002/login
2. In the first field type: dev@kvarteret.dev. In the second field type: dev-password. Click the login button.

You should see:

- Personal's front page, logged in as Dev Admin.

- [ ] It matched

### 7.3 Open the page on real data

Do this:

1. In Chrome, open: http://localhost:3190/?api=http

You should see:

- The page with four bars at the top: Grøndahls, Halvtimen, Kjøkken and Stjerne. "Dev Admin" at the top right.
- At the bottom, the small text says "Leser fra og lagrer i Personal. Alt du endrer lagres med en gang."
- The address in Chrome now ends with something like ?api=http&bar=9&uke=2026-11-02: the bar and week are in the address.
- A grid with names that are not the invented ones from before. (On the bar Stjerne, for example, William Lie and Live Moen.)
- On Stjerne week 45 (uke=2026-11-02), the round button says "5 ledige". The grid shows 7 empty boxes: the two empty "Opplæring" boxes are not counted, because a trainee is an extra and not something the shift needs. Click "5 ledige" and the box on the right opens one of the places that need someone.

- [ ] It matched

### 7.4 Bars, weeks and the address

Do this:

1. Click "Stjerne" at the top. Look at the address.
2. Click the arrow > next to the week buttons. Look at the address.
3. Press F5.

You should see:

- Step 1: the grid changes to Stjerne's shifts, and the address says bar=7.
- Step 2: the title says the next week, and the address has a new date after uke=.
- Step 3: after reloading you are on the same bar and the same week.

- [ ] It matched

### 7.5 Hours

Do this:

1. On the Stjerne week 45 (uke=2026-11-02), look in "Folk denne uka" for a person who has a shift (a line with "t" for hours, for example "1 uka · 1 mnd · 6 t").

You should see:

- The number of hours is the planned length of the shifts the person is coming to (people with no shift show no hours).

- [ ] It matched

### 7.6 When you are not logged in

Do this:

1. In Chrome, open: http://localhost:8002/logout (confirm if it asks).
2. Open http://localhost:3190/?api=http
3. Click "Logg inn i Personal".

You should see:

- Step 2: a page that says "Fikk ikke hentet skiftlista" and "Du er ikke logget inn i Personal." with the buttons "Logg inn i Personal" and "Prøv igjen".
- Step 3: Personal's login page. (Log in again as in 7.2 and click "Prøv igjen" on the page, and the week appears.)

- [ ] It matched

### 7.7 When you are finished

Press Ctrl and C in each of the three Ubuntu windows.

## Part 8 (optional): Change the week on real demo data

This changes Personal's demo database. Nothing here is real, and each change can be undone. Do Part 7 first (Personal and the page must be running and you must be logged in).

Use the bar Stjerne and week 47: open `http://localhost:3190/?api=http&bar=7&uke=2026-11-16`. The round button should say "5 ledige".

### 8.1 Place a person and undo

Do this:

1. Click "Uten skift" in the box on the right, and click the first person in the list.
2. Click one of the places that now says "Sett inn ..." (without "Krever bekreftelse").
3. Press Ctrl and Z at the same time.

You should see:

- Step 2: a green message "... er satt opp som ...", the place shows the name, and the round button changes to "4 ledige".
- Step 3: the message says the person is taken off, the place is free again, and the button says "5 ledige" again.

- [ ] It matched

### 8.2 The popup on real data

Do this:

1. Click "Uten skift", then click a person in the list who does NOT have "SL" to the right of the name.
2. Click a Skiftleder place that says "Krever bekreftelse".
3. Read the popup, then click "Sett inn likevel".
4. Press Ctrl and Z.

You should see:

- Step 2: the popup with a red border. It lists red lines, for example "Kun for godkjente skiftledere".
- Step 3: the person is placed, with a message that may add "Advarsel: ...".
- Step 4: the person is taken off again.

- [ ] It matched

### 8.3 Two leaders at once

Do this:

1. Open the same address in two Chrome tabs (week 47, bar 7). Call them tab 1 and tab 2.
2. In tab 1, place any person on any free place (as in 8.1 steps 1 and 2).
3. In tab 2, without reloading, place someone on another free place.
4. In tab 2, try the same again.
5. Undo in tab 1 (Ctrl and Z) so the data is as before.

You should see:

- Step 3: a red message "En annen leder har endret uka. Siden er oppdatert, prøv igjen." Nothing is placed, and tab 2 now shows what tab 1 did.
- Step 4: this time it works.

- [ ] It matched

### 8.4 Move and swap

Do this:

1. Click a person who is placed on a Skjenker place, and click "Flytt eller bytt" in the box on the right.
2. Click an empty Skjenker place that says "Flytt hit".
3. Press Ctrl and Z.
4. Click a person placed on a Skjenker place, click "Flytt eller bytt", and click another Skjenker place that says "Bytt med ...".
5. Press Ctrl and Z.

You should see:

- Step 2: "... er flyttet til ...", and the person is on the new place.
- Step 3: the person is back on the old place.
- Step 4: "... og ... har byttet plass."
- Step 5: they are back where they were.

- [ ] It matched

### 8.5 Publish and make a draft

Do this:

1. Open `http://localhost:3190/?api=http&bar=7&uke=2026-11-23` (week 48, a coming week).
2. Click the red button "Publiser uka".
3. Click "Gjør til utkast".
4. Open `http://localhost:3190/?api=http&bar=7&uke=2026-11-02` (week 45, which has already started).
5. Click "Gjør til utkast".

You should see:

- Step 2: a message "Uke 48 for Stjerne: publisert ...", and the label next to the week number says "Publisert".
- Step 3: "Uke 48 for Stjerne: åpen for ønsker." and the label says "Utkast".
- Step 5: a red message from Personal: "Uka er i gang eller over, og kan ikke åpnes for ønsker. Bare kommende uker kan åpnes." The week stays published.

- [ ] It matched

### 8.6 A leader with one bar only

Do this:

1. Open `http://localhost:8001/login` and log in with `stjerne.leder@kvarteret.dev` and `dev-password`. (This copy of Personal is started with `DEV_ADMIN_EMAIL=stjerne.leder@kvarteret.dev DEV_ADMIN_PASSWORD=dev-password uv run uvicorn app.main:create_app --factory --port 8001` in `~/kvarteret/kvarteret-personal`, if it is not running.)
2. Open `http://localhost:3190/?api=http`.
3. Try opening `http://localhost:3190/?api=http&bar=9` (Grøndahls).

You should see:

- Step 2: only one bar at the top, Stjerne.
- Step 3: you still see Stjerne. A leader cannot open or change a bar they have no access to.

- [ ] It matched

### 8.7 More or fewer places on real demo data

Use the bar Stjerne, week 47: `http://localhost:3190/?api=http&bar=7&uke=2026-11-16`. Every change here is saved in Personal's demo database, and each is undone by the next steps.

Do this:

1. Click "+" on the line "Skjenker" under the places of any shift. Note the message and the round button "ledige".
2. Press Ctrl and Z at the same time.
3. Click "+" on a shift again, and then "−" on the same line.
4. On a shift where all the Skjenker places have people, click "−".
5. Open the same address in a second Chrome tab (tab 2). In tab 1 do step 1. In tab 2 (without reloading) click "+". Then press Ctrl and Z in tab 1.

You should see:

- Step 1: "Ny plass som skjenker, ...", one more empty Skjenker place, and the number of "ledige" goes up by one.
- Step 2: the extra place is gone and "ledige" is back.
- Step 3: the place appears and goes away again.
- Step 4: "−" is dimmed and does nothing, because no Skjenker place is empty. Personal also refuses it with "Alle plassene av denne typen er i bruk. Ta personen av først." if the place was filled meanwhile.
- Step 5: in tab 2 a red message "En annen leder har endret uka. Siden er oppdatert, prøv igjen." and nothing is added, as in 8.3.
- A shift that is closed has no "−" and "+".
- Skiftleder and Opplæring have no "−" or "+", and Personal refuses them too: "Et skift har én skiftleder. Den legges ikke til eller fjernes her."

- [ ] It matched

### 8.8 Changed after publishing, and who did it

Do this first (once): the database needs the new columns. Read `kvarteret-personal/migrations/versions/20261103_1200_week_changed_after_publish.py` (two nullable columns, nothing else), then in an Ubuntu window type each line on its own:

    cd ~/kvarteret/kvarteret-personal

    uv run alembic upgrade head

You should see: a line "Running upgrade 20261101_1200 -> 20261103_1200". (Without this step the real board does not load.)

Use the bar Stjerne, week 47: `http://localhost:3190/?api=http&bar=7&uke=2026-11-16`. Write down the status shown at the top (probably "Utkast: ikke synlig i appen").

Do this:

1. Click "Publiser uka". Nothing yellow yet.
2. Place a person on an empty place (select a name, click "Sett inn ...").
3. Reload the page (F5).
4. Click "Publiser uka" again.
5. Put the week back the way it was: if it was a draft, click "Lag utkast" (the button that reopens the week). Ctrl+Z the placement first if you placed someone and want it gone.

You should see:

- Step 2: the label says "Endret etter publisering" (yellow) and the box under the title ends with "Sist endret av Dev Admin, kl. HH:MM."
- Step 3: the same after the reload, because it is saved in Personal.
- Step 4: the yellow label and the box are gone; the label says "Publisert".
- Volunteers are not affected: the week is still "published" for them the whole time.

- [ ] It matched

## Part 6: Tell us what you found

For each problem, write down four things:

1. Which test (for example 2.8).

2. What you did.

3. What you expected to see.

4. What you saw instead.

A picture helps a lot: press the Windows key, Shift and S together, drag a box around the problem, and paste it (Ctrl and V) into your message.

Things that are not finished yet, so you do not need to report them:

- There is no real login. The page always says "Demo-leder".
- Nothing is saved. Reloading the page (F5) starts over.
- The button "Lag forslag for uka" is grey on purpose, and its hover text says "Kommer senere". Suggestions come later.
- The text about "Vis andre" in the box on the right is a placeholder for something that comes later.
- Not built yet on real data: "Lag forslag for uka".
- On a phone, the box "Folk denne uka" is shown below the grid. A special phone layout for the whole page comes later (only the place sheet, test 4.4, is done).

## For developers (optional): the automatic checks

These run the same checks the computer runs on its own. Run them in the Ubuntu window, one command at a time. Stop the page first (Ctrl and C) or use a second Ubuntu window.

Go to the project folder:

    cd ~/kvarteret/samfunnetibergen

Check the code for mistakes:

    npm run typecheck:skiftlista

You should see: The last line says 0 ERRORS 0 WARNINGS.

Run the small tests:

    npm run test:skiftlista

You should see: It says Tests 44 passed (44).

Go to the app folder:

    cd apps/internal/skiftlista

Tell the test browser where its extra files are (needed on this computer):

    export LD_LIBRARY_PATH=~/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu

Run the browser tests (they click through the page by themselves, about 15 seconds):

    npx playwright test

You should see: It ends with 59 passed. (50 run in a laptop-sized window and 9 in a phone-sized window; the computer switches the window size by itself. Some of them pretend to be Personal, so they work without it.)
