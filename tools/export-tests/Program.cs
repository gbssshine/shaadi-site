using System.Text.Encodings.Web;
using System.Text.Json;
using MauiApp2.Services;
using MauiApp2.Services.TestResults;

var levels = new[] { "VeryHigh", "High", "Moderate", "Low", "VeryLow", "Undecided" };
var t = typeof(TestInterpretation);
List<string> L(TestInterpretation i, string prop) => (t.GetProperty(prop)?.GetValue(i) as List<string>) ?? new();
string S(TestInterpretation i, string prop) => (t.GetProperty(prop)?.GetValue(i) as string) ?? "";

var cats = TestsCatalog.GetCategories().Select(c => new { id = c.Id, title = c.Title, description = c.Description });
var tests = new List<object>();
foreach (var s in TestsCatalog.GetAllTests())
{
    var d = TestsContentService.GetTestById(s.Id) ?? throw new Exception("no test " + s.Id);
    var i = InterpretationRegistry.Get(s.Id) ?? throw new Exception("no interpretation " + s.Id);
    var bands = levels.ToDictionary(l => l, l => new
    {
        label = S(i, l + "Label"),
        summaries = L(i, l + "Summaries"),
        behaviors = L(i, l + "Behaviors"),
        strengths = L(i, l + "Strengths"),
        weaknesses = L(i, l + "Weaknesses"),
        realLife = L(i, l + "RealLife"),
        tips = L(i, l + "Tips"),
    });
    tests.Add(new
    {
        id = d.Id, category = d.CategoryId, title = d.Title, subtitle = d.Subtitle,
        description = d.Description, whatYouLearn = d.WhatYouLearn, howItHelpsMatch = d.HowItHelpsMatch,
        questions = d.Questions.Select(q => new { text = q.Text, reverse = q.IsReverse }),
        measures = i.MeasuresWhat, bands,
    });
}
var json = JsonSerializer.Serialize(new { categories = cats, tests },
    new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
var outPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "tests-data.json"));
File.WriteAllText(outPath, json);
Console.WriteLine($"{tests.Count} tests -> {outPath}");
