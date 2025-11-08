#!/usr/bin/env python3
"""
Live Time Tracker Session Stop Conditions Guide
This script explains when the current session timer stops.
"""

def explain_session_stop_conditions():
    """Explain when the current session timer stops"""
    
    print("⏰ LIVE TIME TRACKER - SESSION STOP CONDITIONS")
    print("=" * 60)
    
    print("\n🛑 AUTOMATIC STOP CONDITIONS:")
    print("1. User Inactivity (30+ seconds):")
    print("   • Timer pauses after 30 seconds of no activity")
    print("   • Detects: mouse movement, clicks, keyboard, scroll, touch")
    print("   • Status changes to 'Away - No activity detected'")
    print("   • Timer resumes when user becomes active again")
    
    print("\n2. Page/Tab Visibility Changes:")
    print("   • Timer pauses when you switch to another tab")
    print("   • Timer pauses when browser window loses focus")
    print("   • Status changes to 'Away - Tab not active'")
    print("   • Timer resumes when you return to the tab")
    
    print("\n3. Browser/Page Unload:")
    print("   • Timer stops when you close the browser")
    print("   • Timer stops when you navigate away from the page")
    print("   • Timer stops when you refresh the page")
    print("   • Session data is saved to localStorage before stopping")
    
    print("\n🎮 MANUAL STOP CONDITIONS:")
    print("1. Pause Button:")
    print("   • Click the 'Pause' button to manually pause")
    print("   • Status changes to 'Tracking Paused'")
    print("   • Timer stops counting but session continues")
    print("   • Click 'Resume' to continue the same session")
    
    print("\n2. Reset Session Button:")
    print("   • Click 'Reset Session' to start a new session")
    print("   • Current session time resets to 00:00:00")
    print("   • Previous session time is saved to daily total")
    print("   • New session starts immediately")
    
    print("\n💾 DATA PERSISTENCE:")
    print("• Session data is saved every second to localStorage")
    print("• Data survives page refreshes and browser restarts")
    print("• Daily and weekly totals are preserved")
    print("• Session can be resumed if interrupted")
    
    print("\n🔄 SESSION RESUMPTION:")
    print("• If you return to the page the same day:")
    print("  - Previous session time is restored")
    print("  - Timer continues from where it left off")
    print("  - Daily total includes previous sessions")
    print("• If you return on a different day:")
    print("  - New session starts fresh")
    print("  - Previous day's data is preserved")
    
    print("\n📊 TIMER BEHAVIOR:")
    print("• Current Session: Shows live session time")
    print("• Today Total: Shows all sessions for today")
    print("• This Week: Shows all sessions for current week")
    print("• All timers update every second when active")
    
    print("\n🎯 PRACTICAL EXAMPLES:")
    print("1. Working on exercises for 10 minutes:")
    print("   • Timer runs continuously")
    print("   • Shows 00:10:00 in Current Session")
    
    print("\n2. Taking a 5-minute break (no activity):")
    print("   • Timer pauses after 30 seconds")
    print("   • Shows 'Away - No activity detected'")
    print("   • Resumes when you return")
    
    print("\n3. Switching to another tab for 2 minutes:")
    print("   • Timer pauses immediately")
    print("   • Shows 'Away - Tab not active'")
    print("   • Resumes when you return to tab")
    
    print("\n4. Closing browser and returning later:")
    print("   • Session data saved to localStorage")
    print("   • Timer resumes from where it left off")
    print("   • Daily total includes previous time")
    
    print("\n⚠️ IMPORTANT NOTES:")
    print("• Timer only stops completely on page unload")
    print("• Pausing is temporary - session continues")
    print("• Resetting starts a completely new session")
    print("• Data is automatically saved every second")
    print("• No manual save required - everything is automatic")
    
    print("\n🚀 SUMMARY:")
    print("The current session timer stops when:")
    print("✅ You manually pause it")
    print("✅ You reset the session")
    print("✅ You leave the page/tab")
    print("✅ You close the browser")
    print("✅ You navigate away from the site")
    print("\nBut it automatically resumes when you return!")

if __name__ == "__main__":
    explain_session_stop_conditions()
