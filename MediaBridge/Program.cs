using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Windows.Media.Control;

class Program
{
    static async Task Main()
    {
        while (true)
        {
            try
            {
                var manager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
                var sessions = manager.GetSessions();

                foreach (var session in sessions)
                {
                    if (!session.SourceAppUserModelId.ToLower().Contains("tidal"))
                        continue;

                    var info = await session.TryGetMediaPropertiesAsync();
                    var timeline = session.GetTimelineProperties();
                    var playback = session.GetPlaybackInfo();

                    var output = new
                    {
                        title = info.Title,
                        artist = info.Artist,
                        duration = timeline.EndTime.TotalMilliseconds,
                        position = timeline.Position.TotalMilliseconds,
                        paused = playback.PlaybackStatus != GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing
                    };

                    Console.WriteLine(JsonSerializer.Serialize(output));
                    break;
                }
            }
            catch { }

            await Task.Delay(2000);
        }
    }
}