using System.Text.Json;
using MauiApp2.Services;
using MauiApp2.Services.TestResults;

// For every test: 300 random answer sets (1..5 per statement) scored by the app's engine.
// Writes tools/scoring-samples.json: [{id, answers, intensity, label}]
var rnd = new Random(42);
var rows = new List<object>();
foreach (var s in TestsCatalog.GetAllTests())
{
    var t = TestsContentService.GetTestById(s.Id)!;
    for (int k = 0; k < 300; k++)
    {
        // mix fully random sets with "lean" sets so extreme bands are covered too
        var bias = k % 3 == 0 ? 0 : (k % 3 == 1 ? 1 : -1);
        var answers = t.Questions.Select(q => {
            var v = rnd.Next(1, 6) + (q.IsReverse ? -bias : bias) * rnd.Next(0, 3);
            return Math.Clamp(v, 1, 5);
        }).ToList();
        var a = AnswerAnalysis.Analyze(t, answers);
        var score = TestsScoringService.Score(t, answers);
        rows.Add(new { id = t.Id, answers, intensity = a.Intensity.ToString(), label = score.Band.Label });
    }
}
var outPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "scoring-samples.json"));
File.WriteAllText(outPath, JsonSerializer.Serialize(rows));
Console.WriteLine($"{rows.Count} samples -> {outPath}");
