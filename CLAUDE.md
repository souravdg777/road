A React Native (Expo) app that lets users explore the real world by “unlocking” map tiles as they move.



Think: fog-of-war for real-world movement.



⸻



Core loop



Move → detect location → convert to tile → unlock tile → show instantly on map



⸻



What matters most



1. Instant feedback — tiles should appear immediately when unlocked

2. Smooth tracking — no jitter, no jumpy updates

3. Low latency — UI must not wait on storage or async work

4. Mobile performance — avoid heavy computation



⸻



Architecture rules



* UI updates should happen before DB writes

* GPS → processing → UI must be fast and lightweight

* Storage is local-first (SQLite)

* No backend assumptions for now



⸻



Implementation approach



* Use simple grid-based tiles (no heavy geo libs)

* Filter GPS noise using basic thresholds + smoothing

* Avoid duplicate tile writes (use in-memory cache)

* Render only visible tiles (bounded queries)



⸻



When suggesting changes



* Prefer simple, practical solutions

* Avoid overengineering

* Optimize for perceived responsiveness, not perfect accuracy

* Suggest incremental improvements, not full rewrites