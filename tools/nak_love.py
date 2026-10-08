"""Nakshatras in love: three traits and one line each, for the "Find your rashi" result, its share picture and its
link previews. Classical lords, ganas and symbols come with them (the symbols as in the app's Astrology Library).
Run:  python tools/nak_love.py   -> assets/js/nak-love.js (build_tools.py imports NAK_LOVE directly)
"""
import json
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# key: (traits, love line, lord, gana, animal (yoni))
NAK_LOVE = {
    "ashwini": (["Quick", "Brave", "Healing"], "You fall fast, fix things faster and hate waiting games.", "Ketu", "Deva", "Horse"),
    "bharani": (["Passionate", "Honest", "Intense"], "You love with your whole heart and say exactly what you feel.", "Venus", "Manushya", "Elephant"),
    "krittika": (["Sharp", "Protective", "Fiery"], "Fiercely loyal, a little blunt, and you guard your people.", "Sun", "Rakshasa", "Sheep"),
    "rohini": (["Charming", "Romantic", "Steady"], "The Moon’s favourite: cosy, romantic and hard to forget.", "Moon", "Manushya", "Serpent"),
    "mrigashira": (["Curious", "Gentle", "Restless"], "You look for someone who keeps the conversation alive.", "Mars", "Deva", "Serpent"),
    "ardra": (["Deep", "Honest", "Stormy"], "Big feelings, bigger honesty. After the storm, you’re all heart.", "Rahu", "Manushya", "Dog"),
    "punarvasu": (["Hopeful", "Kind", "Forgiving"], "You believe in second chances and in coming home.", "Jupiter", "Deva", "Cat"),
    "pushya": (["Nurturing", "Loyal", "Wise"], "You show love by looking after people, every single day.", "Saturn", "Deva", "Sheep"),
    "ashlesha": (["Magnetic", "Intuitive", "Private"], "You read people in a glance and love with quiet intensity.", "Mercury", "Rakshasa", "Cat"),
    "magha": (["Proud", "Generous", "Rooted"], "Family and dignity first. You love like royalty.", "Ketu", "Rakshasa", "Rat"),
    "purva_phalguni": (["Playful", "Warm", "Romantic"], "Made for romance: long dates, laughter and slow Sundays.", "Venus", "Manushya", "Rat"),
    "uttara_phalguni": (["Dependable", "Kind", "Committed"], "The promise keeper: when you commit, you mean it.", "Sun", "Manushya", "Cow"),
    "hasta": (["Skilful", "Witty", "Caring"], "For you, love is in the small things your hands do.", "Moon", "Deva", "Buffalo"),
    "chitra": (["Stylish", "Creative", "Bold"], "You make love feel like art and notice every detail.", "Mars", "Rakshasa", "Tiger"),
    "swati": (["Independent", "Easy-going", "Fair"], "You need room to breathe, and you give it back freely.", "Rahu", "Deva", "Buffalo"),
    "vishakha": (["Driven", "Determined", "Passionate"], "Once you choose someone, you go all in, goals and all.", "Jupiter", "Rakshasa", "Tiger"),
    "anuradha": (["Devoted", "Friendly", "Loyal"], "Friendship first, then a devotion that lasts.", "Saturn", "Deva", "Deer"),
    "jyeshtha": (["Protective", "Responsible", "Proud"], "The eldest at heart: you protect the ones you love.", "Mercury", "Rakshasa", "Deer"),
    "mula": (["Truthful", "Bold", "Intense"], "You want the real thing, roots and all. Nothing fake.", "Ketu", "Rakshasa", "Dog"),
    "purva_ashadha": (["Confident", "Charming", "Optimistic"], "You win hearts with charm and never give up on love.", "Venus", "Manushya", "Monkey"),
    "uttara_ashadha": (["Principled", "Patient", "Loyal"], "Slow and steady: you build a love that lasts.", "Sun", "Manushya", "Mongoose"),
    "shravana": (["Attentive", "Wise", "Calm"], "You listen like no one else and love by understanding.", "Moon", "Deva", "Monkey"),
    "dhanishta": (["Lively", "Social", "Generous"], "Life of the party, heart of gold, loyal to the beat.", "Mars", "Rakshasa", "Lion"),
    "shatabhisha": (["Independent", "Healing", "Mysterious"], "A quiet healer who loves deeply and needs time alone.", "Rahu", "Rakshasa", "Horse"),
    "purva_bhadrapada": (["Idealistic", "Intense", "Spiritual"], "You love with fire and big dreams for you both.", "Jupiter", "Manushya", "Lion"),
    "uttara_bhadrapada": (["Calm", "Deep", "Patient"], "Still waters run deep: your love is calm and constant.", "Saturn", "Manushya", "Cow"),
    "revati": (["Gentle", "Caring", "Dreamy"], "You look after people quietly, softly and forever.", "Mercury", "Deva", "Elephant"),
}


def symbols():
    """Symbols from the Astrology Library data (assets/js/nak-data.js), e.g. "a fish, or a drum"."""
    raw = open(os.path.join(HERE, "assets", "js", "nak-data.js"), encoding="utf-8").read()
    data = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
    out = {}
    for k, v in data.items():
        for f in v.get("facts", []):
            if f[0].lower() == "symbol":
                out[k] = f[1]
    return out


def main():
    sym = symbols()
    js = {k: {"traits": t, "love": l, "lord": lord, "gana": g, "animal": a, "symbol": sym.get(k, "")}
          for k, (t, l, lord, g, a) in NAK_LOVE.items()}
    with open(os.path.join(HERE, "assets", "js", "nak-love.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write("/* Generated by tools/nak_love.py — edit there. */\nwindow.NAK_LOVE = " + json.dumps(js, ensure_ascii=False, indent=1) + ";\n")
    print(len(js), "nakshatras;", sum(1 for k in js if js[k]["symbol"]), "with symbols")


if __name__ == "__main__":
    main()
