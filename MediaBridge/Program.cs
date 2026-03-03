using System;
using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Automation;

class Program
{
    static async Task Main()
    {
        AutomationElement tidalWindow = null;

        Console.Error.WriteLine("Waiting for TIDAL to start...");

        // Wait for TIDAL main window
        while (tidalWindow == null)
        {
            foreach (var p in Process.GetProcessesByName("TIDAL"))
            {
                if (p.MainWindowHandle != IntPtr.Zero)
                {
                    tidalWindow = AutomationElement.FromHandle(p.MainWindowHandle);
                    break;
                }
            }
            await Task.Delay(1000);
        }

        Console.Error.WriteLine($"Found TIDAL window: {tidalWindow.Current.Name}");

        var timeRegex = new Regex(@"^\d{1,2}:\d{2}(:\d{2})?$");

        while (true)
        {
            string title = "";
            string artist = "";
            double positionMs = 0;
            double durationMs = 0;
            bool paused = true;

            try
            {
                // --- Log all children for debugging ---
                var children = tidalWindow.FindAll(TreeScope.Children, Condition.TrueCondition);
                Console.Error.WriteLine($"--- TIDAL Children ({children.Count}) ---");
                foreach (AutomationElement child in children)
                {
                    Console.Error.WriteLine(
                        $"Child: Name='{child.Current.Name}', AutomationId='{child.Current.AutomationId}', Class='{child.Current.ClassName}', ControlType='{child.Current.ControlType.ProgrammaticName}'"
                    );
                }

                // --- Find current song container ---
                AutomationElement currentSongEl = null;
                foreach (AutomationElement child in children)
                {
                    if (child.Current.ClassName.Contains("RootView"))
                    {
                        currentSongEl = child;
                        break;
                    }
                }

                if (currentSongEl != null)
                {
                    Console.Error.WriteLine($"Found current song container: {currentSongEl.Current.Name}");

                    // --- Title & Artist from RootView Name ---
                    string fullName = currentSongEl.Current.Name.Trim(); // e.g., "Gotham Love - BAKGROUND"
                    if (!string.IsNullOrEmpty(fullName) && fullName.Contains(" - "))
                    {
                        var parts = fullName.Split(new[] { " - " }, 2, StringSplitOptions.None);
                        title = parts[0].Trim();
                        artist = parts[1].Trim();
                    }
                    else
                    {
                        title = fullName;
                        artist = "TIDAL";
                    }

                    // --- Position & Duration ---
                    var allSongChildren = currentSongEl.FindAll(TreeScope.Descendants, Condition.TrueCondition);
                    foreach (AutomationElement child in allSongChildren)
                    {
                        if (child.Current.ControlType == ControlType.Text && timeRegex.IsMatch(child.Current.Name.Trim()))
                        {
                            double t = ParseTime(child.Current.Name.Trim());
                            if (positionMs == 0)
                                positionMs = t;
                            else if (durationMs == 0)
                                durationMs = t;
                        }
                    }

                    // --- Paused / Playing ---
                    foreach (AutomationElement child in allSongChildren)
                    {
                        if (child.Current.ControlType == ControlType.Button && !string.IsNullOrEmpty(child.Current.Name))
                        {
                            string name = child.Current.Name.Trim();
                            if (name.Equals("Pause", StringComparison.OrdinalIgnoreCase))
                            {
                                paused = false;
                                break;
                            }
                            else if (name.Equals("Play", StringComparison.OrdinalIgnoreCase))
                            {
                                paused = true;
                                break;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error reading TIDAL info: {ex.Message}");
            }

            // --- Output JSON ---
            var json = JsonSerializer.Serialize(new
            {
                title,
                artist,
                duration = durationMs,
                position = positionMs,
                paused
            });

            Console.WriteLine(json);
            Console.Out.Flush();

            await Task.Delay(1000);
        }
    }

    // Safe ParseTime
    static double ParseTime(string time)
    {
        if (string.IsNullOrEmpty(time)) return 0;

        var parts = time.Split(':');
        int h = 0, m = 0, s = 0;

        try
        {
            if (parts.Length == 2)
            {
                if (!int.TryParse(parts[0], out m)) return 0;
                if (!int.TryParse(parts[1], out s)) return 0;
            }
            else if (parts.Length == 3)
            {
                if (!int.TryParse(parts[0], out h)) return 0;
                if (!int.TryParse(parts[1], out m)) return 0;
                if (!int.TryParse(parts[2], out s)) return 0;
            }
            else
            {
                return 0;
            }
        }
        catch
        {
            return 0;
        }

        return ((h * 3600) + (m * 60) + s) * 1000;
    }
}