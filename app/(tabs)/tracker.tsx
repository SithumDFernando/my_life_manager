import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { accounts, subscriptions, readingItems, achievements } from "@/lib/storage";
import type { Account, Subscription, ReadingItem, Achievement } from "@/lib/types";
import { useRouter } from "expo-router";

type TabType = "accounts" | "subscriptions" | "reading" | "achievements";

export default function TrackerScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("accounts");
  const [data, setData] = useState({
    accounts: [] as Account[],
    subscriptions: [] as Subscription[],
    reading: [] as ReadingItem[],
    achievements: [] as Achievement[],
  });
  const router = useRouter();

  const loadData = useCallback(async () => {
    const [accs, subs, reads, achs] = await Promise.all([
      accounts.getAll(),
      subscriptions.getAll(),
      readingItems.getAll(),
      achievements.getAll(),
    ]);
    setData({ accounts: accs, subscriptions: subs, reading: reads, achievements: achs });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "accounts", label: "Accounts", icon: "key.fill" },
    { key: "subscriptions", label: "Subscriptions", icon: "money.dollar.fill" },
    { key: "reading", label: "Reading", icon: "book.fill" },
    { key: "achievements", label: "Achievements", icon: "star.fill" },
  ];

  const getAddRoute = () => {
    switch (activeTab) {
      case "accounts": return "/(add)/account";
      case "subscriptions": return "/(add)/subscription";
      case "reading": return "/(add)/reading";
      case "achievements": return "/(add)/achievement";
    }
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E" }}>Tracker</Text>
        <Pressable
          onPress={() => router.push(getAddRoute() as any)}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: activeTab === tab.key ? "#5B8DEF" : "#F7F8FA",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <IconSymbol name={tab.icon} size={16} color={activeTab === tab.key ? "#FFFFFF" : "#8B8FA3"} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: activeTab === tab.key ? "#FFFFFF" : "#8B8FA3" }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === "accounts" && <AccountsList data={data.accounts} onRefresh={loadData} />}
        {activeTab === "subscriptions" && <SubscriptionsList data={data.subscriptions} onRefresh={loadData} />}
        {activeTab === "reading" && <ReadingList data={data.reading} onRefresh={loadData} />}
        {activeTab === "achievements" && <AchievementsList data={data.achievements} onRefresh={loadData} />}
      </ScrollView>
    </ScreenContainer>
  );
}

// Accounts List
function AccountsList({ data, onRefresh }: { data: Account[]; onRefresh: () => void }) {
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = ["all", "email", "google", "social", "website", "financial", "other"];
  const filtered = data.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.username.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Account", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await accounts.delete(id); onRefresh(); } },
    ]);
  };

  if (data.length === 0) return <EmptyState text="No accounts saved yet" icon="key.fill" />;

  return (
    <View>
      <TextInput
        placeholder="Search accounts..."
        value={search}
        onChangeText={setSearch}
        style={{ backgroundColor: "#F7F8FA", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }}
        placeholderTextColor="#8B8FA3"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
        {categories.map((cat) => (
          <Pressable key={cat} onPress={() => setFilterCategory(cat)} style={({ pressed }) => ({
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
            backgroundColor: filterCategory === cat ? "#5B8DEF" : "#F7F8FA",
            opacity: pressed ? 0.85 : 1,
          })}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: filterCategory === cat ? "#FFF" : "#8B8FA3", textTransform: "capitalize" }}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filtered.map((item) => (
        <View key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2, textTransform: "capitalize" }}>{item.category}</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
              <IconSymbol name="trash" size={18} color="#F87171" />
            </Pressable>
          </View>
          <View style={{ marginTop: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", width: 70 }}>User:</Text>
              <Text style={{ fontSize: 13, color: "#1A1A2E", flex: 1 }}>{item.username}</Text>
              <Pressable onPress={() => {}}>
                <IconSymbol name="doc.on.doc" size={16} color="#5B8DEF" />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#8B8FA3", width: 70 }}>Pass:</Text>
              <Text style={{ fontSize: 13, color: "#1A1A2E", flex: 1, fontFamily: "monospace" }}>
                {showPass[item.id] ? item.password : "••••••••"}
              </Text>
              <Pressable onPress={() => setShowPass((p) => ({ ...p, [item.id]: !p[item.id] }))}>
                <IconSymbol name={showPass[item.id] ? "eye.slash" : "eye"} size={16} color="#5B8DEF" />
              </Pressable>
            </View>
            {item.url ? (
              <Text style={{ fontSize: 12, color: "#5B8DEF", marginTop: 4 }}>{item.url}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// Subscriptions List
function SubscriptionsList({ data, onRefresh }: { data: Subscription[]; onRefresh: () => void }) {
  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Subscription", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await subscriptions.delete(id); onRefresh(); } },
    ]);
  };

  const totalCost = data.filter((s) => s.status === "active").reduce((sum, s) => sum + s.cost, 0);

  if (data.length === 0) return <EmptyState text="No subscriptions tracked yet" icon="money.dollar.fill" />;

  return (
    <View>
      <View style={{ backgroundColor: "#F7F8FA", borderRadius: 12, padding: 14, marginBottom: 14, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: "#8B8FA3" }}>Total Monthly Spend</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#34D399", marginTop: 4 }}>${totalCost.toFixed(2)}</Text>
      </View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{item.category} • {item.billingCycle}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#34D399" }}>${item.cost.toFixed(2)}</Text>
              <Text style={{ fontSize: 11, color: "#8B8FA3", marginTop: 2 }}>{item.renewalDate}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ padding: 3, borderRadius: 6, backgroundColor: item.status === "active" ? "#34D39920" : "#F8717120" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: item.status === "active" ? "#34D399" : "#F87171" }}>{item.status}</Text>
              </View>
            </View>
            <Pressable onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
              <IconSymbol name="trash" size={18} color="#F87171" />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

// Reading List
function ReadingList({ data, onRefresh }: { data: ReadingItem[]; onRefresh: () => void }) {
  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await readingItems.delete(id); onRefresh(); } },
    ]);
  };

  if (data.length === 0) return <EmptyState text="No reading items yet" icon="book.fill" />;

  return (
    <View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>by {item.author}</Text>
              <Text style={{ fontSize: 11, color: "#5B8DEF", marginTop: 2, textTransform: "capitalize" }}>{item.type.replace("_", " ")}</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id, item.title)} style={{ padding: 4 }}>
              <IconSymbol name="trash" size={18} color="#F87171" />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <View style={{ padding: 4, borderRadius: 6, backgroundColor: item.status === "completed" ? "#34D39920" : item.status === "reading" ? "#FBBF2420" : "#8B8FA320" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: item.status === "completed" ? "#34D399" : item.status === "reading" ? "#FBBF24" : "#8B8FA3" }}>
                {item.status.replace("_", " ")}
              </Text>
            </View>
            {item.rating ? (
              <Text style={{ fontSize: 12, color: "#8B8FA3" }}>Rating: {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// Achievements List
function AchievementsList({ data, onRefresh }: { data: Achievement[]; onRefresh: () => void }) {
  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await achievements.delete(id); onRefresh(); } },
    ]);
  };

  if (data.length === 0) return <EmptyState text="No achievements yet. Start winning!" icon="star.fill" />;

  return (
    <View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: "#E8EAED" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2, textTransform: "capitalize" }}>{item.type}</Text>
            </View>
            <Pressable onPress={() => handleDelete(item.id, item.title)} style={{ padding: 4 }}>
              <IconSymbol name="trash" size={18} color="#F87171" />
            </Pressable>
          </View>
          {item.date ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 6 }}>{item.date}</Text> : null}
          {item.place ? <Text style={{ fontSize: 12, color: "#5B8DEF", marginTop: 2 }}>Place: {item.place}</Text> : null}
          {item.prize ? <Text style={{ fontSize: 12, color: "#34D399", marginTop: 2 }}>Prize: {item.prize}</Text> : null}
          {item.description ? <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 6, lineHeight: 16 }}>{item.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function EmptyState({ text, icon }: { text: string; icon: any }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 60 }}>
      <IconSymbol name={icon} size={48} color="#E8EAED" />
      <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>{text}</Text>
    </View>
  );
}
