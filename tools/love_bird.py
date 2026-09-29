"""Content for the "Which love bird are you?" web test.

Single source of truth: build_tests.py turns this into assets/js/love-bird-data.js,
the static result pages and the share images. Run `python tools/love_bird.py` to
check that every bird can win and roughly how often.
"""

BIRDS = {
    "swan": dict(name="Swan", tagline="One heart. One lifetime.",
        traits=["Loyal to the bone", "Slow to trust, then all in", "Remembers every date that matters"],
        love="You don't do casual. When you choose someone, you choose them on the bad days too, and you expect the same back.",
        match="penguin", why="Two steady hearts who show up every single day.",
        flag="You stay too long, even when it's time to fly.", tint="#FFE9EC"),
    "peacock": dict(name="Peacock", tagline="Love, but make it public.",
        traits=["Grand gestures", "Hypes their person to everyone", "Always dressed for the plan"],
        love="You love out loud: surprise plans, long captions, the full show. The person you love always feels celebrated.",
        match="owl", why="You bring the show, they bring the depth. And they'll read every word of your captions.",
        flag="Sometimes the show matters more than the feeling.", tint="#E4F3EA"),
    "owl": dict(name="Owl", tagline="Slow to fall. Deep once you do.",
        traits=["Deep 2 AM conversations", "Notices what others miss", "Falls slowly, but for real"],
        love="You watch, you listen, you think it over for weeks. Once you're in, you understand your person better than anyone.",
        match="peacock", why="They bring colour to your quiet. You give their big heart somewhere safe to land.",
        flag="You overthink a 'k' for three working days.", tint="#F4E6D6"),
    "sparrow": dict(name="Sparrow", tagline="Love me, but don't cage me.",
        traits=["Spontaneous plans", "Needs room to breathe", "Friends with everyone"],
        love="You're warm, curious and easy to be around. You love best when love feels like freedom, not a rulebook.",
        match="eagle", why="Two free spirits. Nobody clips anybody's wings.",
        flag="You vanish when things get serious.", tint="#F8E8D2"),
    "lovebird": dict(name="Lovebird", tagline="Together is the whole point.",
        traits=["Good-morning texts, every morning", "Quality time over everything", "Hugs first, talks later"],
        love="Distance is not your thing. You show love by being there: calls, plans, company, as much as possible.",
        match="hummingbird", why="Nonstop texts, nonstop plans. Nobody gets bored.",
        flag="Two hours without a reply feels like a breakup.", tint="#E8F4DA"),
    "dove": dict(name="Dove", tagline="Let's talk it out.",
        traits=["Calm in a storm", "The friend everyone calls", "Soft words, strong heart"],
        love="Fights don't scare you; silence does. You'd rather have one honest talk than a week of cold shoulders.",
        match="crow", why="You teach them to let go. They teach you to speak up for yourself.",
        flag="You keep the peace and swallow your own needs.", tint="#F2EEF3"),
    "crow": dict(name="Crow", tagline="Clever, loyal, and keeping notes.",
        traits=["Sharp, witty humour", "Loyal to a chosen few", "Never forgets a detail"],
        love="You're hard to impress, but fiercely loyal to the few who get in. You also remember everything, good and bad.",
        match="dove", why="Their calm softens your edges. Your loyalty is the safest place they know.",
        flag="You forgive, but you never forget. And you bring it up.", tint="#ECE7EE"),
    "flamingo": dict(name="Flamingo", tagline="Main character in a love story.",
        traits=["Lives for filmy moments", "Believes in destiny", "Stands out in any crowd"],
        love="You believe in the rain scene, the song and the slow-motion look. You want love that feels like a film.",
        match="koel", why="A full Bollywood soundtrack, every single day.",
        flag="You fall for the story in your head, not the person in front of you.", tint="#FFE0E6"),
    "eagle": dict(name="Eagle", tagline="Loves big. Aims higher.",
        traits=["Big goals, clear plans", "Fiercely protective", "Wants a partner, not a fan"],
        love="You're building a big life and you want someone who builds it with you. You protect what you love.",
        match="sparrow", why="You both need sky. You'll fly further side by side.",
        flag="Your calendar has a slot for everything except feelings.", tint="#F6E7D0"),
    "hummingbird": dict(name="Hummingbird", tagline="All butterflies, all the time.",
        traits=["Instant chemistry", "Fun, fast, full of plans", "Makes every day feel new"],
        love="You fall fast and make everything exciting. The real test is staying when the spark turns into routine.",
        match="lovebird", why="They match your energy and they never let the spark go quiet.",
        flag="The spark fades, and so do you.", tint="#E2F3E9"),
    "penguin": dict(name="Penguin", tagline="Here's a pebble. It means forever.",
        traits=["Small acts of care", "Home is their happy place", "Steady as a rock"],
        love="You skip the grand gestures. You bring chai when they're tired and remember exactly how they take it.",
        match="swan", why="Two steady hearts who show up every single day.",
        flag="Comfort zone? You built a house in it.", tint="#EAEFF0"),
    "koel": dict(name="Koel", tagline="Every feeling has a song.",
        traits=["Feels everything deeply", "Says it best in songs", "Remembers the soundtrack of every moment"],
        love="You feel everything a little more than others, and you say it through music, poetry and 3 AM voice notes.",
        match="flamingo", why="A full Bollywood soundtrack, every single day.",
        flag="Your mood has a soundtrack, and it changes every hour.", tint="#F1E6DA"),
}

# Each option: (text, primary bird +2, secondary bird +1)
QUESTIONS = [
    ("It's a free Sunday. What are you doing?", [
        ("Planning a surprise for someone special", "peacock", "lovebird"),
        ("Going somewhere new, no plan at all", "sparrow", "hummingbird"),
        ("Home, chai and my people", "penguin", "swan"),
        ("Journal, playlist and a long walk alone", "koel", "owl"),
    ]),
    ("Someone you like replies after 6 hours. You…", [
        ("Reply after 6 hours too. Balance.", "crow", "eagle"),
        ("Have already typed and deleted three drafts", "owl", "flamingo"),
        ("Didn't even notice, I was busy", "eagle", "crow"),
        ("Ask if everything's okay", "dove", "lovebird"),
    ]),
    ("Your perfect first meeting?", [
        ("Cutting chai at a quiet café, hours of talk", "dove", "owl"),
        ("Rooftop, fairy lights, dressed to impress", "peacock", "flamingo"),
        ("Street food crawl, whatever happens happens", "hummingbird", "sparrow"),
        ("A long drive with the right songs", "koel", "lovebird"),
    ]),
    ("What wins your heart?", [
        ("Showing up. Every day. No drama.", "swan", "penguin"),
        ("A gesture so big the group chat hears about it", "peacock", "flamingo"),
        ("Making me laugh till my stomach hurts", "crow", "peacock"),
        ("Remembering a little thing I said once", "penguin", "crow"),
    ]),
    ("In a fight, you usually…", [
        ("Want to fix it tonight with a proper talk", "dove", "lovebird"),
        ("Go quiet and need space first", "sparrow", "owl"),
        ("Forgive… but remember", "crow", "swan"),
        ("Make it dramatic, then make up big", "flamingo", "koel"),
    ]),
    ("The family asks, “So when is the shaadi?”", [
        ("When I find the one. I'm not settling.", "swan", "flamingo"),
        ("After my career is sorted, thank you", "eagle", "crow"),
        ("Laugh, change the topic, escape to the kitchen", "hummingbird", "dove"),
        ("Honestly? I've already planned the sangeet", "lovebird", "peacock"),
    ]),
    ("Which song mood is you right now?", [
        ("Old Kishore Kumar romance", "koel", "swan"),
        ("Wedding dance-floor banger", "hummingbird", "peacock"),
        ("Lo-fi, headphones on, world off", "owl", "koel"),
        ("Road-trip anthem, windows down", "sparrow", "koel"),
    ]),
    ("Pick the text you'd love to get:", [
        ("“Reached home? Text me.”", "penguin", "lovebird"),
        ("“Missing you. Call?”", "lovebird", "dove"),
        ("“Proud of you. You'll get there.”", "eagle", "swan"),
        ("“Look outside. The moon is full.”", "flamingo", "owl"),
    ]),
]

ORDER = list(BIRDS)


def score(answers):
    """answers: option index per question. Tie-break: more +2 hits, then the latest primary."""
    pts = {b: 0 for b in BIRDS}
    prim = {b: 0 for b in BIRDS}
    last = {b: -1 for b in BIRDS}
    for qi, ai in enumerate(answers):
        _, p, s = QUESTIONS[qi][1][ai]
        pts[p] += 2
        prim[p] += 1
        last[p] = qi
        pts[s] += 1
    return max(BIRDS, key=lambda b: (pts[b], prim[b], last[b], -ORDER.index(b)))


if __name__ == "__main__":
    import itertools
    from collections import Counter
    for b, d in BIRDS.items():
        assert d["match"] in BIRDS, b
    c = Counter(score(a) for a in itertools.product(range(4), repeat=len(QUESTIONS)))
    total = sum(c.values())
    for b in ORDER:
        print(f"{b:12s} {100 * c[b] / total:5.1f}%")
