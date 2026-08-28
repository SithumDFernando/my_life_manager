import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Collapsible } from "@/components/ui/collapsible";

export default function HelpScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 12, gap: 16 }}>
        <Collapsible title="Security & PIN Lock">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            MyLife Manager is completely offline-first. All data is stored on your device using AsyncStorage — nothing is ever sent to the cloud.
            {"\n\n"}
            On first launch you will be asked to create a 6-digit PIN. Every subsequent launch requires entering this PIN before you can access the app. If you need to change it, go to the More tab and tap "Change PIN". You will be asked to verify your current PIN first, then set and confirm a new one.
            {"\n\n"}
            There is no PIN recovery mechanism, so make sure you remember it. If you lose your PIN, the only option is to reinstall the app, which will erase all local data unless you have a backup.
          </Text>
        </Collapsible>

        <Collapsible title="Daily Tasks & Carry-Over">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            The Daily tab is your day-to-day execution center. You can quickly add tasks using the text input at the top and check them off as you complete them.
            {"\n\n"}
            When you open the app on a new day, any tasks from yesterday that were left incomplete won't disappear. Instead, a "Carry-Over" modal will appear asking you which unfinished tasks you'd like to move to today's list. You can select individual tasks to carry over or discard them.
            {"\n\n"}
            The progress bar at the top shows your combined completion percentage for both tasks and habits for the selected day. Completed tasks show a filled circle, while pending ones show an empty circle.
          </Text>
        </Collapsible>

        <Collapsible title="Habits & Weekly Quotas">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Habits are managed from the Improve tab and executed daily from the Daily tab. There are three habit types:
            {"\n\n"}
            Positive (Build): Actions you want to do regularly, like "Morning Meditation" or "Read 20 Pages". Tap the circle to mark them complete for the day.
            {"\n\n"}
            Avoidance (Break): Behaviours you want to avoid, like "No Junk Food" or "No Social Media past 10 PM". These start each day in a safe "shield active" state. If you slip, tap "Log Slip" to record it honestly.
            {"\n\n"}
            Numeric (Counter): Measurable targets like "Drink 3000ml water" or "Walk 10000 steps". Tap the habit to open a logger where you can enter exact values.
            {"\n\n"}
            Flexible Weekly Quotas: A habit like "Gym 3x/week" doesn't require you to go on specific days. Complete it any 3 days during the week (Monday to Sunday). The counter shows your progress (e.g. 2/3).
            {"\n\n"}
            Streak Shields: You receive 1 streak shield per week, refilled every Monday. If you miss your target for the week, the shield is automatically consumed to protect your streak. If no shield is available, the streak resets to 0.
            {"\n\n"}
            24-Hour Grace Window: Forgot to log yesterday's habit? Use the date toggle at the top of the Daily screen to switch to "Yesterday" and check off what you actually completed. Days older than yesterday are view-only.
          </Text>
        </Collapsible>

        <Collapsible title="Master Targets & Gamification">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Master Targets are high-level goals like "Get Shredded" or "Master AI Engineering" that you define in the Improve tab. Each target can have a flexible deadline type: None, a specific Deadline date, or a Date Range.
            {"\n\n"}
            You can link multiple habits to a single Master Target to track which daily actions contribute to which long-term goal. Deleting a Master Target gives you the option to either unlink or archive its associated habits.
            {"\n\n"}
            Gamification: Every habit completion earns XP. Your XP accumulates across all habits and determines your level. You start at Level 1 "Novice Initiate" and progress through ranks like "Discipline Warrior", "Habit Master", and ultimately "Titan of Focus" at Level 50. Your current level and XP are displayed as a banner at the top of the Improve tab.
          </Text>
        </Collapsible>

        <Collapsible title="Projects & Service Accounts">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Projects live under the Tracker tab. Each project can track its title, status (Ongoing, Completed, On Hold, Planned), category, GitHub repository link, tech stack, and a description.
            {"\n\n"}
            The unique feature is Service-Account Mapping. For each project, you can record which of your stored Accounts (e.g. your work Google account vs personal Gmail) is used for which cloud service (e.g. AWS, Vercel, Firebase, Supabase). This is especially useful when you manage multiple Google or GitHub accounts across different projects.
            {"\n\n"}
            To add a mapping, open a project's detail view, tap "Add Service", select the cloud service, and link it to one of your saved accounts from the Accounts module.
          </Text>
        </Collapsible>

        <Collapsible title="Accounts & Credentials">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            The Accounts module (under Tracker) stores your login credentials securely on the device. Each account has a name, category (e.g. Social, Email, Cloud, Dev Tools), username, password, URL, and optional notes.
            {"\n\n"}
            Passwords are masked by default. Tap the eye icon to reveal them, and tap the copy icon to copy the username or password to your clipboard. You can search and filter accounts by category using the pill selector at the top.
          </Text>
        </Collapsible>

        <Collapsible title="Subscription Tracking">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            The Subscriptions module (under Tracker) helps you keep track of recurring expenses. Each subscription records its name, cost, currency, billing cycle (monthly/yearly), renewal date, and status (active, paused, cancelled).
            {"\n\n"}
            The total monthly spend is automatically calculated and displayed at the top of the Subscriptions sub-tab. Yearly subscriptions are divided by 12 to give you an equivalent monthly cost. This gives you a clear picture of your total recurring burn rate.
          </Text>
        </Collapsible>

        <Collapsible title="Reading Tracker">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Track books, research papers, and articles you are reading. Each item has a type, title, author, status (Not Started, Reading, Completed), page count, pages read, a 1-5 star rating, and optional notes.
            {"\n\n"}
            The status filter at the top lets you quickly see what you're currently reading versus what's on your backlog. Completed items show your star rating prominently.
          </Text>
        </Collapsible>

        <Collapsible title="Backup & Migration">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Since all data is stored locally with no cloud sync, backups are critical. Go to More &gt; Backup & Restore to export your entire app state as a single JSON string. The export includes all modules: accounts, subscriptions, tasks, habits, habit logs, master targets, projects, notes, competitions, events, venues, bio data, daily reports, and your PIN.
            {"\n\n"}
            The JSON is automatically copied to your clipboard when you tap "Export Data". Save it somewhere safe — a file on your PC, a note in Google Keep, or an email to yourself.
            {"\n\n"}
            To restore, paste the JSON string into the import field on a new device (or after reinstalling) and tap "Import". This will overwrite all existing data on the device with the backup contents. The app will prompt you to restart afterwards.
          </Text>
        </Collapsible>

        <Collapsible title="Notes & Full-Screen Editor">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            Notes can be created and managed from More &gt; Notes. Each note has a title, category, and body content. Tapping a note or "New Note" opens a full-screen editor inspired by Samsung Notes and Apple Notes.
            {"\n\n"}
            The editor features a large borderless title field, a spacious body area, a word count, and a category picker. It auto-saves as you type using a debounce mechanism, so you never lose your thoughts even if you navigate away or close the app unexpectedly.
          </Text>
        </Collapsible>

        <Collapsible title="Appearance & Themes">
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
            MyLife Manager supports Light mode, Dark mode, and a System Default option that follows your device's theme setting. You can switch between them from More &gt; Appearance. All colours in the app are dynamically themed — no element uses hardcoded colours.
          </Text>
        </Collapsible>
      </ScrollView>
    </ScreenContainer>
  );
}
