"""Check assets/js/astro-core.js against the sources it copies:
  - the Moon against Swiss Ephemeris (sidereal, Lahiri);
  - charts and Guna Milan against the app's Daily Fates (shaadiparrot-face-verification/fates_astro*.py);
  - love luck against the daily reels (shaadi-parrot-cartoon/tools/daily.py).
Run:  python tools/check_astro.py      (needs node, pyswisseph and both sibling repos)
"""
import datetime as dt
import json
import os
import random
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPOS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPOS, "shaadiparrot-face-verification"))
sys.path.insert(0, os.path.join(REPOS, "shaadi-parrot-cartoon", "tools"))
sys.stdout.reconfigure(encoding="utf-8")

import swisseph as swe  # noqa: E402
import fates_astro as FA  # noqa: E402
from fates_astro_chart import chart_from_birth  # noqa: E402
import daily  # noqa: E402

RUNNER = r"""
global.window = global;
const A = require(process.argv[2]);
let buf = ""; process.stdin.on("data", d => buf += d).on("end", () => {
  const jobs = JSON.parse(buf), out = {};
  out.moon = jobs.moon.map(ms => A.siderealMoon(new Date(ms)));
  out.koota = jobs.koota.map(([b, g]) => A.kootaPoints(b, g));
  out.charts = jobs.charts.map(b => A.chart(b));
  out.match = jobs.match.map(([a, b, ga, gb]) => { const ca = A.chart(a), cb = A.chart(b); return { ca, cb, r: A.match(ca, cb, ga, gb) }; });
  out.luck = jobs.luck.map(d => A.loveLuck(d));
  process.stdout.write(JSON.stringify(out));
});
"""

random.seed(7)
swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
fails = 0


def rand_birth(timed):
    d = dt.date(1955, 1, 1) + dt.timedelta(days=random.randrange(0, 19000))
    b = {"y": d.year, "m": d.month, "d": d.day}
    if timed:
        b["h"], b["mi"] = random.randrange(24), random.randrange(60)
    return b


jobs = {"moon": [], "koota": [], "charts": [], "match": [], "luck": []}
t0 = dt.datetime(1950, 1, 1, tzinfo=dt.timezone.utc)
moments = [t0 + dt.timedelta(minutes=random.randrange(0, 80 * 365 * 1440)) for _ in range(3000)]
jobs["moon"] = [int(m.timestamp() * 1000) for m in moments]
for _ in range(5000):
    pair = []
    for _ in range(2):
        lon = random.uniform(0, 360)
        pair.append({"rashi": int(lon // 30), "nak": int(lon // (360 / 27)), "lon": lon})
    jobs["koota"].append(pair)
jobs["charts"] = [rand_birth(random.random() < 0.5) for _ in range(1500)]
for _ in range(2000):
    jobs["match"].append([rand_birth(random.random() < 0.4), rand_birth(random.random() < 0.4),
                          random.choice(["male", "female"]), random.choice(["male", "female"])])
days = [dt.date(2026, 1, 1) + dt.timedelta(days=i) for i in range(400)]
jobs["luck"] = [{"y": d.year, "m": d.month, "d": d.day} for d in days]

runner = os.path.join(os.environ.get("TEMP", "."), "astro_runner.js")
open(runner, "w", encoding="utf-8").write(RUNNER)
res = json.loads(subprocess.run(["node", runner, os.path.join(HERE, "assets", "js", "astro-core.js")],
                                input=json.dumps(jobs), capture_output=True, text=True, encoding="utf-8", check=True).stdout)

# 1. Moon
diffs, nak_bad = [], 0
for m, js in zip(moments, res["moon"]):
    jd = swe.julday(m.year, m.month, m.day, m.hour + m.minute / 60)
    ref = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)[0][0]
    diffs.append(abs((js - ref + 540) % 360 - 180))
    nak_bad += int(js // (360 / 27)) != int(ref // (360 / 27))
diffs.sort()
print(f"1. Moon vs Swiss Ephemeris: median {diffs[len(diffs) // 2] * 3600:.0f}\", 99% under {diffs[int(len(diffs) * .99)] * 3600:.0f}\", "
      f"max {diffs[-1] * 3600:.0f}\"; nakshatra differs in {nak_bad} of {len(diffs)} random moments")
fails += diffs[-1] > 0.15

# 2. koota points
bad = 0
for (b, g), js in zip(jobs["koota"], res["koota"]):
    py = FA.koota_points(b, g)
    if any(abs(py[k] - js[k]) > 1e-9 for k in py):
        bad += 1
        if bad < 4:
            print("   koota mismatch", b, g, py, js)
print(f"2. koota points vs fates_astro: {len(jobs['koota']) - bad} of {len(jobs['koota'])} identical")
fails += bad > 0

# 3. charts vs chart_from_birth (noon Moon and every position the day allows)
bad = 0
for b, js in zip(jobs["charts"], res["charts"]):
    t = (b["h"], b["mi"]) if "h" in b else None
    py = chart_from_birth((b["y"], b["m"], b["d"]), t, {"tz": "Asia/Kolkata"})
    bad += not (py["rashi"] == js["rashi"] and py["nak"] == js["nak"] and py["pada"] == js["pada"]
                and sorted(map(tuple, py["options"])) == sorted(map(tuple, js["options"])))
print(f"3. charts vs chart_from_birth: {len(jobs['charts']) - bad} of {len(jobs['charts'])} identical "
      "(any difference = a Moon within ~0.1° of a boundary)")
fails += bad > len(jobs["charts"]) * 0.01

# 4. match: the same charts through the app's match_charts, so only the matching logic is compared
bad = 0
for (a, b, ga, gb), js in zip(jobs["match"], res["match"]):
    pc = [{"rashi": c["rashi"], "nak": c["nak"], "pada": c["pada"], "moonLon": c["lon"], "options": c["options"],
           "precision": c["precision"]} for c in (js["ca"], js["cb"])]
    py, r = FA.match_charts(pc[0], pc[1], ga, gb), js["r"]
    ok = (py["total"] == r["total"] and py["totalMin"] == r["totalMin"] and py["totalMax"] == r["totalMax"]
          and [(k["name"], k["points"], k["meaning"]) for k in py["kootas"]] == [(k["name"], k["points"], k["meaning"]) for k in r["kootas"]]
          and [d for d in py["doshas"] if d["name"] != "Manglik"] == [{k: d[k] for k in ("name", "present", "cancelled", "why")} for d in r["doshas"]]
          and py["aMoon"]["nakshatra"] == r["aMoon"]["nakshatra"] and py["bMoon"]["rashi"].replace("Vrischika", "Vrishchika") == r["bMoon"]["rashi"])
    if not ok:
        bad += 1
        if bad < 3:
            print("   match mismatch", a, b, ga, gb, "\n   py", py["total"], py["kootas"], "\n   js", r["total"], r["kootas"])
print(f"4. full match vs match_charts (totals, ranges, 8 kootas with words, doshas): {len(jobs['match']) - bad} of {len(jobs['match'])} identical")
fails += bad > 0

# 5. love luck vs the daily reels
bad = rounded = 0
for d, js in zip(days, res["luck"]):
    fx = daily.facts(d)
    houses = [fx["rashi"][s] for s in daily.SIGNS]
    caution = [fx["caution"].get(s) for s in daily.SIGNS]
    lucky = [s for s in daily.SIGNS if daily.HEARTS[fx["rashi"][s]] == 5 and s not in fx["caution"]]
    crowned = lucky[:2] or sorted((s for s in daily.SIGNS if s not in fx["caution"]), key=lambda s: -daily.HEARTS[fx["rashi"][s]])[:1]
    line = [daily.LINES[h][d.toordinal() % 2] for h in houses]
    # the sign-change minute may round the other way (the Moon is within ~20" of Swiss Ephemeris, ~40 s of motion)
    t_py, t_js = (fx["moon_change"] or {}).get("time"), (js["change"] or {}).get("time")
    minutes = lambda t: (dt.datetime.strptime(t, "%I:%M %p") - dt.datetime(1900, 1, 1)).seconds // 60 if t else None
    near = t_py == t_js or (t_py and t_js and abs(minutes(t_py) - minutes(t_js)) <= 1)
    if near and t_py != t_js:
        rounded += 1
        caution = [c.replace(t_py, t_js) if c else c for c in caution]
    ok = (houses == [x["house"] for x in js["rashis"]] and caution == [x["caution"] for x in js["rashis"]]
          and [daily.SIGNS.index(s) for s in crowned] == js["crowned"] and line == [x["line"] for x in js["rashis"]] and near)
    if not ok:
        bad += 1
        if bad < 3:
            print("   luck mismatch", d, houses, [x["house"] for x in js["rashis"]], fx["moon_change"], js["change"], caution)
print(f"5. love luck vs daily.py: {len(days) - bad} of {len(days)} days identical (houses, hearts, lines, Chandrashtama, crowns); "
      f"on {rounded} of them the Moon's sign-change time rounds to the next minute")
fails += bad > 0

print("OK" if not fails else f"FAILED ({fails})")
sys.exit(1 if fails else 0)
