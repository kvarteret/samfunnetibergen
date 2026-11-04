> **Old standalone demo guide.** It describes the first Render and Vercel demo,
> with its own forks and project. The current guide is
> `docs/how-to/skiftlista-leader-app.md`. The git steps below predate the move to
> `apps/internal/skiftlista` and the shared Vercel setup, so read them as history.

# Full guide: show the leader app on Render and Vercel

Fake data only. Nothing here touches Kvarteret's real systems or repositories.

How the pieces fit:

- **Render** runs Personal (the server and the demo database), as the demo already does.
- **Vercel** serves the leader app as a static page at `https://skiftlista-spike.vercel.app`. Vercel forwards `/personal/...`, `/login` and `/static/...` to Render, so the browser sees one address and the login cookie works.
- **Expo is not used.** Expo builds phone apps. This is a web page: on a phone you open the same Vercel address in the browser.

You need: your Render login, your Vercel login, the demo database address and the demo access code (the one you set as `DEMO_ACCESS_CODE` on Render).

For each step: do it, compare with "You should see", tick the box. If it differs, stop and write down what you did and what you saw.

## Part 1: Get the code onto your GitHub forks

### 1.1 Check what is waiting

Open an Ubuntu window (Windows key, type Ubuntu, Enter). Type each line on its own and press Enter.

    cd ~/kvarteret/kvarteret-personal

    git status --short

You should see: ` M render.yaml` (only that line). If you see more, tell me before going on.

- [ ] It matched

### 1.2 Commit and push Personal

    git add render.yaml

    git commit -m "chore(render): serve the leader API branch and allow the leader app origin" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"

    git push origin skiftlista/leader-api

You should see: a line ending in `skiftlista/leader-api -> skiftlista/leader-api`. The address in the output must start with `github.com:Mortey12/`. Never push to `upstream`.

- [ ] It matched

### 1.3 Commit and push the app

    cd ~/kvarteret/samfunnetibergen

    git status --short

You should see: `M apps/internal/skiftlista/.gitignore`, `M apps/internal/skiftlista/package.json`, `?? apps/internal/skiftlista/DEMO.md`, `?? apps/internal/skiftlista/demo/vercel.json`.

    git add apps/internal/skiftlista

    git commit -m "feat(skiftlista): demo build and guide for Render and Vercel" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"

    git push origin skiftlista/leder-app

You should see: a line ending in `skiftlista/leder-app -> skiftlista/leder-app`.

- [ ] It matched

## Part 2: Update the Render demo

### 2.1 Add the two new columns to the demo database

Do this before the new code goes live, because the new code reads the columns. The change is two empty columns on one table, nothing else.

1. Open https://dashboard.render.com and click your demo database.
2. Find "External Database URL" (under Connections) and copy it. It looks like `postgresql://user:password@host/dbname`.
3. Change the start from `postgresql://` to `postgresql+asyncpg://` and add `?ssl=require` at the very end.
4. In Ubuntu, type each line on its own. In the second line, replace the text between the quotes with your changed address.

       cd ~/kvarteret/kvarteret-personal

       export DATABASE_URL='PASTE-THE-ADDRESS-HERE'

       uv run alembic upgrade head

You should see: a line "Running upgrade 20261101_1200 -> 20261103_1200: Skiftlista: remember when and by whom a published week was changed." (If the demo database was older, earlier "Running upgrade" lines come first. That is fine.) No red error text.

5. Close the Ubuntu window so the password is not kept.

- [ ] It matched

### 2.2 Check that Render reads your fork

1. In the Render dashboard open the web service `skiftlista-demo`, then Settings.
2. Under "Repository" it must be `Mortey12/kvarteret-personal`. If it is something else, stop and tell me.

- [ ] It matched

### 2.3 Choose the new branch and the allowed origin

1. Still in Settings, find "Branch". Change it to `skiftlista/leader-api` and save.
2. Open "Environment". Click "Add Environment Variable".
3. Name: `LEADER_APP_ORIGINS`. Value: `https://skiftlista-spike.vercel.app` (no slash at the end, no path). Save. Render starts a new deploy.
4. Open "Events" or "Logs" and wait until it says the deploy is live.
5. Open `https://skiftlista-demo.onrender.com/health` in Chrome.

You should see: a short answer from the health page. The free plan sleeps after 15 minutes, so the first request can take up to a minute.

If the deploy fails, open the log and look at the last red lines. A line about `LEADER_APP_ORIGINS` means the value is not a plain `https://host` address.

- [ ] It matched

## Part 3: Build and publish the app on Vercel

### 3.1 Build the demo version

    cd ~/kvarteret/samfunnetibergen/apps/internal/skiftlista

    npm run build:demo

You should see: "built in ..." and no red errors. A folder `dist-demo` now exists with `index.html`, `assets` and `vercel.json`.

- [ ] It matched

### 3.2 Log in to Vercel (once)

    npx vercel login

Choose how to log in with the arrow keys and Enter, follow the link it prints, and confirm in the browser.

You should see: "Success" or your email in the terminal.

- [ ] It matched

### 3.3 Publish

    cd ~/kvarteret/samfunnetibergen/apps/internal/skiftlista/dist-demo

    npx vercel deploy --prod

Answer the questions:

- "Set up and deploy?" yes.
- Scope: your own account.
- "Link to existing project?" yes, and choose `skiftlista-spike` (if it is not in the list, answer no and give it the name `skiftlista-spike`).
- Anything else: press Enter.

You should see: "Production: https://skiftlista-spike.vercel.app" (or similar) at the end.

If the address is different, `LEADER_APP_ORIGINS` on Render must be changed to exactly that address (step 2.3 point 3), and then wait for the Render deploy.

- [ ] It matched

## Part 4: Show it

Do this a few minutes before the meeting.

1. Open `https://skiftlista-demo.onrender.com/health` so the free service wakes up.
2. Open `https://skiftlista-spike.vercel.app/login`.

   You should see: Personal's login page, with "Demo, falske data" at the top and a "Demo-leder" login.
3. Log in with "Demo-leder" and the demo access code.
4. The page may take you to the `onrender.com` address afterwards. That is fine. Open `https://skiftlista-spike.vercel.app/` again.

   You should see: the leader app with the bars at the top, "Uke ..." and at the bottom "Leser fra og lagrer i Personal."

Things to show:

- Select a person under "Folk denne uka" and click a place that says "Sett inn ...". Press Ctrl and Z to undo.
- Click "+" and "−" on a Skjenker line. "−" only takes away an empty place.
- Place a person who lacks a qualification: the red popup asks first.
- Click "Publiser uka". Change something. The box says "Endret etter publisering" and "Sist endret av Demo Leder, kl. ...".
- Open the Vercel address on a phone after logging in on the phone: the place panel opens as a sheet.

Everything saved is fake data in the demo database.

## If something is wrong

- **"Ikke logget inn", or the login page does not load:** you are on another host than the Vercel address, or Render is asleep. Wake it with the health page and log in again at the Vercel `/login`.
- **A change says it is not allowed (403):** `LEADER_APP_ORIGINS` on Render is not exactly the Vercel address.
- **The week does not load, and Render's log mentions `changed_after_publish_at`:** step 2.1 was not run on this database.
- **The week is empty:** the demo data is relative to the date it was seeded. Ask me how to seed it again.
- **Render does not deploy the new branch:** check Settings, Repository and Branch (2.2 and 2.3).

## Taking it down

Vercel: dashboard, project `skiftlista-spike`, Settings, Delete. Render: set the branch back to `skiftlista/demo` and remove `LEADER_APP_ORIGINS`.
