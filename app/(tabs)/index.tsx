import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { accounts, subscriptions, projects, tasks, readingItems } from "@/lib/storage";

interface ModuleCard {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  route: string;
  count?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState({
    accounts: 0,
    subscriptions: 0,
    projects: 0,
    tasks: 0,
    readings: 0,
  });

  const loadData = useCallback(async () => {
    const [accs, subs, projs, tsks, reads] = await Promise.all([
      accounts.getAll(),
      subscriptions.getAll(),
      projects.getAll(),
      tasks.getAll(),
      readingItems.getAll(),
    ]);
    setCounts({
      accounts: accs.length,
      subscriptions: subs.filter((s) => s.status === "active").length,
      projects: projs.filter((p) => p.status === "ongoing").length,
      tasks: tsks.filter((t) => !t.completed).length,
      readings: reads.filter((r) => r.status === "reading").length,
    });
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  const modules: ModuleCard[] = [
    {
      title: "Accounts",
      subtitle: `${counts.accounts} saved`,
      icon: "key.fill",
      iconColor: "#5B8DEF",
      route: "/(tabs)/tracker",
      count: counts.accounts,
    },
    {
      title: "Subscriptions",
      subtitle: `${counts.subscriptions} active`,
      icon: "money.dollar.fill",
      iconColor: "#34D399",
      route: "/(tabs)/tracker",
      count: counts.subscriptions,
    },
    {
      title: "Projects",
      subtitle: `${counts.projects} ongoing`,
      icon: "folder_special",
      iconColor: "#5B8DEF",
      route: "/(tabs)/projects",
      count: counts.projects,
    },
    {
      title: "Daily Tasks",
      subtitle: `${counts.tasks} pending`,
      icon: "event_note",
      iconColor: "#FBBF24",
      route: "/(tabs)/daily",
      count: counts.tasks,
    },
    {
      title: "Reading",
      subtitle: `${counts.readings} in progress`,
      icon: "book.fill",
      iconColor: "#F87171",
      route: "/(tabs)/tracker",
      count: counts.readings,
    },
    {
      title: "Competitions",
      subtitle: "Events & contests",
      icon: "trophy.fill",
      iconColor: "#FBBF24",
      route: "/(tabs)/more",
    },
    {
      title: "Achievements",
      subtitle: "Awards & milestones",
      icon: "star.fill",
      iconColor: "#FBBF24",
      route: "/(tabs)/tracker",
    },
    {
      title: "Bio Data",
      subtitle: "Personal info",
      icon: "person.fill",
      iconColor: "#5B8DEF",
      route: "/(tabs)/more",
    },
  ];

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ paddingTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: "#8B8FA3", fontWeight: "500" }}>
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E", marginTop: 4 }}>
            {greeting}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
          <QuickStat label="Accounts" value={counts.accounts} color="#5B8DEF" />
          <QuickStat label="Active" value={counts.subscriptions} color="#34D399" />
          <QuickStat label="Tasks" value={counts.tasks} color="#FBBF24" />
        </View>

        {/* Module Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {modules.map((mod) => (
            <Pressable
              key={mod.title}
              onPress={() => {
                router.push(mod.route as any);
              }}
              style={({ pressed }) => ({
                width: "48%",
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: "#E8EAED",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: mod.iconColor + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name={mod.icon} size={20} color={mod.iconColor} />
                </View>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{mod.title}</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{mod.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, padding: 12, alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: "#8B8FA3", marginTop: 2 }}>{label}</Text>
    </View>
  );
}
