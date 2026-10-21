# 📞 Dial Tone — The Office Slacker Sim

A 3D-lite browser game for outbound sales teams. You're at your desk taking calls, but the real job is
ticking off your **Secret To-Do** (videos, Snake, swiping, shopping…) while dodging the boss.

## Play
- **Drag** to look around, **click** to throw (paper, rubber bands, stress ball, stapler) at the bin or coworkers.
- **E** lean in to the monitor · **Esc** lean back · **Q** panic → CRM · **1–3** pick a reply · **H** hold · **Space** answer · **P** pause
- The boss patrols, inspects and yells at coworkers. When he's in your line of sight, be on the CRM or suspicion fills and you're busted. Three strikes and you're fired.
- **Spicy mode** (title screen toggle, off by default) adds edgier jokes, swearing and cheeky 18+ humour. Not explicit.

## Run locally
No build step. Any static server works:

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to Netlify
Connect this repo in Netlify with **no build command** and publish directory `.` (already set in `netlify.toml`).
Or drag the folder into https://app.netlify.com/drop.

## Layout
- `js/world.js` – Three.js office, people, projectiles
- `js/boss.js` – boss routes, line-of-sight and suspicion
- `js/calls.js` + `js/content.js` – call engine and all the jokes
- `js/apps.js` – CRM, VidTube, Arcade, Chatter, Swipr, Amazoom, Notepad
- `js/tasks.js` – the Secret To-Do list
- `vendor/` – Three.js r160 (MIT), vendored so it works offline

Edit `js/content.js` to add your team's real customer objections and in-jokes.
