using System.Text.Encodings.Web;
using System.Text.Json;
using MauiApp2.Services;
using MauiApp2.Services.TestContent;
using MauiApp2.Services.TestResults;

// Tests v2 (scenes with their own answers, results as types) export their options and their five types; the old
// statement tests export the interpretation bands as before. Undecided shows the middle type, as in the app.
var levels = new[] { "VeryHigh", "High", "Moderate", "Low", "VeryLow", "Undecided" };
var t = typeof(TestInterpretation);
List<string> L(TestInterpretation i, string prop) => (t.GetProperty(prop)?.GetValue(i) as List<string>) ?? new();
string S(TestInterpretation i, string prop) => (t.GetProperty(prop)?.GetValue(i) as string) ?? "";
List<string> Some(params string[] xs) => xs.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

var cats = TestsCatalog.GetCategories().Select(c => new { id = c.Id, title = c.Title, description = c.Description });
var tests = new List<object>();
foreach (var s in TestsCatalog.GetAllTests())
{
    var d = TestsContentService.GetTestById(s.Id) ?? throw new Exception("no test " + s.Id);
    var i = InterpretationRegistry.Get(s.Id) ?? throw new Exception("no interpretation " + s.Id);
    var v2 = TestsV2.Get(s.Id);
    var scale = TestScales.Get(s.Id);
    object bands;
    if (v2 != null && v2.Questions.Count > 0)
    {
        TestType Type(string level) => level switch
        {
            "VeryHigh" => v2.VeryHigh, "High" => v2.High, "Low" => v2.Low, "VeryLow" => v2.VeryLow, _ => v2.Moderate
        };
        bands = levels.ToDictionary(l => l, l =>
        {
            var x = Type(l);
            return (object)new
            {
                label = x.Name,
                emoji = x.Emoji,
                summaries = Some(x.Tagline, x.Portrait),
                behaviors = x.InLove,
                strengths = Some(x.Superpower),
                weaknesses = Some(x.BlindSpot),
                realLife = Some("On a first date: " + x.FirstDate, "In a fight: " + x.InAFight),
                tips = Some(x.Advice),
                match = Some("Best with: " + x.BestWith, "Green flag: " + x.GreenFlag, "Careful with: " + x.RedFlag),
            };
        });
    }
    else
    {
        bands = levels.ToDictionary(l => l, l => (object)new
        {
            label = S(i, l + "Label"),
            emoji = "",
            summaries = L(i, l + "Summaries"),
            behaviors = L(i, l + "Behaviors"),
            strengths = L(i, l + "Strengths"),
            weaknesses = L(i, l + "Weaknesses"),
            realLife = L(i, l + "RealLife"),
            tips = L(i, l + "Tips"),
            match = new List<string>(),
        });
    }
    tests.Add(new
    {
        id = d.Id, category = d.CategoryId, title = d.Title, subtitle = d.Subtitle,
        description = d.Description, whatYouLearn = d.WhatYouLearn, howItHelpsMatch = d.HowItHelpsMatch,
        v2 = v2 != null,
        questions = d.Questions.Select(q => new
        {
            text = q.Text, reverse = q.IsReverse,
            options = q.Options.Select(o => new { text = o.Text, value = o.Value })
        }),
        lowPole = scale.LowPole, highPole = scale.HighPole,
        measures = i.MeasuresWhat, bands,
    });
}
var json = JsonSerializer.Serialize(new { categories = cats, tests },
    new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
var outPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "tests-data.json"));
File.WriteAllText(outPath, json);
Console.WriteLine($"{tests.Count} tests -> {outPath}");
