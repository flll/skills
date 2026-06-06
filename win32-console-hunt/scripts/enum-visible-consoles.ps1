# List visible console windows (conhost with non-empty MainWindowTitle).
param(
  [switch]$Json
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class WinConsoleEnum {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

  public static List<object> VisibleConsoles() {
    var list = new List<object>();
    EnumWindows((hWnd, lParam) => {
      if (!IsWindowVisible(hWnd)) return true;
      var sb = new StringBuilder(512);
      GetWindowText(hWnd, sb, sb.Capacity);
      var title = sb.ToString();
      if (string.IsNullOrWhiteSpace(title)) return true;
      uint pid;
      GetWindowThreadProcessId(hWnd, out pid);
      var proc = System.Diagnostics.Process.GetProcessById((int)pid);
      list.Add(new { hwnd = hWnd.ToInt64(), pid = pid, process = proc.ProcessName, title = title });
      return true;
    }, IntPtr.Zero);
    return list;
  }
}
"@ -ErrorAction SilentlyContinue

$windows = [WinConsoleEnum]::VisibleConsoles()

if ($Json) {
  $windows | ConvertTo-Json -Depth 4
} else {
  foreach ($w in $windows) {
    Write-Output ("{0} pid={1} title={2}" -f $w.process, $w.pid, $w.title)
  }
  Write-Output ("total={0}" -f $windows.Count)
}
