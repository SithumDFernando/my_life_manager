import { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal, FlatList , Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams , useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { accounts, subscriptions, readingItems, achievements } from "@/lib/storage";
import type { Account, Subscription, ReadingItem, Achievement } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";

type TabType = "accounts" | "subscriptions" | "reading" | "achievements";

export default function TrackerScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || "accounts");
  const [data, setData] = useState({
    accounts: [] as Account[],
    subscriptions: [] as Subscription[],
    reading: [] as ReadingItem[],
    achievements: [] as Achievement[],
  });
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    if (tab) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  const loadData = useCallback(async () => {
    const [accs, subs, reads, achs] = await Promise.all([
      accounts.getAll(),
      subscriptions.getAll(),
      readingItems.getAll(),
      achievements.getAll(),
    ]);
    setData({ accounts: accs, subscriptions: subs, reading: reads, achievements: achs });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const tabs: { key: TabType; label: string; icon: string }[] = [
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
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>Tracker</Text>
        <Pressable
          onPress={() => router.push(getAddRoute() as any)}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16, alignItems: "center" }}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <IconSymbol name={tab.icon} size={16} color={activeTab === tab.key ? "#FFFFFF" : colors.muted} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: activeTab === tab.key ? "#FFFFFF" : colors.muted }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === "accounts" && <AccountsList data={data.accounts} onRefresh={loadData} colors={colors} />}
        {activeTab === "subscriptions" && <SubscriptionsList data={data.subscriptions} onRefresh={loadData} colors={colors} />}
        {activeTab === "reading" && <ReadingList data={data.reading} onRefresh={loadData} colors={colors} />}
        {activeTab === "achievements" && <AchievementsList data={data.achievements} onRefresh={loadData} colors={colors} />}
      </ScrollView>
    </ScreenContainer>
  );
}

// Accounts List
function AccountsList({ data, onRefresh, colors }: { data: Account[]; onRefresh: () => void; colors: any }) {
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<Account | null>(null);

  const categories = ["all", "email", "google", "social", "website", "financial", "other"];
  const filtered = data.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.username.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleDelete = (id: string, name: string) => {
    showAlert("Delete Account", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await accounts.delete(id); onRefresh(); } },
    ]);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showAlert("Copied!", "Text copied to clipboard", [{ text: "OK", style: "default" }]);
    }
  };

  if (data.length === 0) return <EmptyState title="No accounts saved yet" icon="key.fill" />;

  return (
    <View>
      <TextInput
        placeholder="Search accounts..."
        value={search}
        onChangeText={setSearch}
        style={{ backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, marginBottom: 10 }}
        placeholderTextColor={colors.muted}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14, alignItems: "center" }}>
        {categories.map((cat) => (
          <Pressable key={cat} onPress={() => setFilterCategory(cat)} style={({ pressed }) => ({
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
            backgroundColor: filterCategory === cat ? colors.primary : colors.surface,
            opacity: pressed ? 0.85 : 1,
          })}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: filterCategory === cat ? "#FFF" : colors.muted, textTransform: "capitalize" }}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filtered.map((item) => (
        <View key={item.id} style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, textTransform: "capitalize" }}>{item.category}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable onPress={() => setEditingItem(item)} style={{ padding: 4 }}>
                <IconSymbol name="pencil" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
                <IconSymbol name="trash" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
          <View style={{ marginTop: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: colors.muted, width: 50 }}>User:</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, flexShrink: 1 }}>{item.username}</Text>
              <Pressable onPress={() => copyToClipboard(item.username)} style={{ padding: 4 }}>
                <IconSymbol name="doc.on.doc" size={16} color={colors.primary} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: colors.muted, width: 50 }}>Pass:</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, fontFamily: "monospace", flexShrink: 1 }}>
                {showPass[item.id] ? item.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              </Text>
              <Pressable onPress={() => setShowPass((p) => ({ ...p, [item.id]: !p[item.id] }))} style={{ padding: 4 }}>
                <IconSymbol name={showPass[item.id] ? "eye.slash" : "eye"} size={16} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => copyToClipboard(item.password)} style={{ padding: 4 }}>
                <IconSymbol name="doc.on.doc" size={16} color={colors.primary} />
              </Pressable>
            </View>
            {item.url ? (
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>{item.url}</Text>
            ) : null}
          </View>
          {editingItem && editingItem.id === item.id && (
            <EditAccountModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={onRefresh} colors={colors} />
          )}
        </View>
      ))}
    </View>
  );
}

// Edit Account Modal
function EditAccountModal({ item, onClose, onSaved, colors }: { item: Account; onClose: () => void; onSaved: () => void; colors: any }) {
  const [form, setForm] = useState(item);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await accounts.update(item.id, form);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  return (
    <BottomSheetModal visible onClose={onClose} title="Edit Account">
      <FormField label="Account Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <FormField label="Username / Email" value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} autoCapitalize="none" />
      <FormField label="Password" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} autoCapitalize="none" />
      <FormField label="URL" value={form.url || ""} onChangeText={(v) => setForm({ ...form, url: v })} autoCapitalize="none" keyboardType="url" />
      <FormField label="Notes" value={form.notes || ""} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />
      
      <Pressable onPress={handleSave} style={({ pressed }) => ({ paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", marginTop: 16, opacity: pressed ? 0.8 : 1 })}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
      </Pressable>
    </BottomSheetModal>
  );
}

// Subscriptions List
function SubscriptionsList({ data, onRefresh, colors }: { data: Subscription[]; onRefresh: () => void; colors: any }) {
  const [editingItem, setEditingItem] = useState<Subscription | null>(null);

  const handleDelete = (id: string, name: string) => {
    showAlert("Delete Subscription", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await subscriptions.delete(id); onRefresh(); } },
    ]);
  };

  const totalCost = data.filter((s) => s.status === "active").reduce((sum, s) => sum + s.cost, 0);
  const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;

  if (data.length === 0) return <EmptyState title="No subscriptions tracked yet" icon="money.dollar.fill" />;

  return (
    <View>
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 14, alignItems: "center" }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>Total Monthly Spend</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.success, marginTop: 4 }}>${totalCost.toFixed(2)}</Text>
      </View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.category} • {item.billingCycle}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Pressable onPress={() => setEditingItem(item)} style={{ padding: 4 }}>
                <IconSymbol name="pencil" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
                <IconSymbol name="trash" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ padding: 3, borderRadius: 6, backgroundColor: item.status === "active" ? colors.success + "20" : colors.error + "20" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: item.status === "active" ? colors.success : colors.error }}>{item.status}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.success }}>{getCurrencySymbol(item.currency)}{item.cost.toFixed(2)}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{item.renewalDate}</Text>
            </View>
          </View>
          {editingItem && editingItem.id === item.id && (
            <EditSubscriptionModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={onRefresh} colors={colors} />
          )}
        </View>
      ))}
    </View>
  );
}

// Edit Subscription Modal
function EditSubscriptionModal({ item, onClose, onSaved, colors }: { item: Subscription; onClose: () => void; onSaved: () => void; colors: any }) {
  const [form, setForm] = useState(item);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await subscriptions.update(item.id, form);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  return (
    <BottomSheetModal visible onClose={onClose} title="Edit Subscription">
      <FormField label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <FormField label="Category" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
      <FormField label="Cost" value={String(form.cost)} onChangeText={(v) => setForm({ ...form, cost: parseFloat(v) || 0 })} keyboardType="decimal-pad" />
      
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Currency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
        {CURRENCIES.map((cur) => (
          <Pressable key={cur.code} onPress={() => setForm({ ...form, currency: cur.code })}
            style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
              backgroundColor: form.currency === cur.code ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: form.currency === cur.code ? "#FFF" : colors.muted }}>{cur.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FormField label="Renewal Date" value={form.renewalDate || ""} onChangeText={(v) => setForm({ ...form, renewalDate: v })} />
      <FormField label="URL" value={form.url || ""} onChangeText={(v) => setForm({ ...form, url: v })} autoCapitalize="none" keyboardType="url" />
      <FormField label="Notes" value={form.notes || ""} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />

      <Pressable onPress={handleSave} style={({ pressed }) => ({ paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", marginTop: 16, opacity: pressed ? 0.8 : 1 })}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
      </Pressable>
    </BottomSheetModal>
  );
}

// Reading List
function ReadingList({ data, onRefresh, colors }: { data: ReadingItem[]; onRefresh: () => void; colors: any }) {
  const [editingItem, setEditingItem] = useState<ReadingItem | null>(null);

  const handleDelete = (id: string, title: string) => {
    showAlert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await readingItems.delete(id); onRefresh(); } },
    ]);
  };

  if (data.length === 0) return <EmptyState title="No reading items yet" icon="book.fill" />;

  return (
    <View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>by {item.author}</Text>
              <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2, textTransform: "capitalize" }}>{item.type.replace("_", " ")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable onPress={() => setEditingItem(item)} style={{ padding: 4 }}>
                <IconSymbol name="pencil" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id, item.title)} style={{ padding: 4 }}>
                <IconSymbol name="trash" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <View style={{ padding: 4, borderRadius: 6, backgroundColor: item.status === "completed" ? colors.success + "20" : item.status === "reading" ? colors.warning + "20" : colors.muted + "20" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: item.status === "completed" ? colors.success : item.status === "reading" ? colors.warning : colors.muted }}>
                {item.status.replace("_", " ")}
              </Text>
            </View>
            {item.rating ? (
              <Text style={{ fontSize: 12, color: colors.muted }}>Rating: {"\u2605".repeat(item.rating)}{"\u2606".repeat(5 - item.rating)}</Text>
            ) : null}
          </View>
          {editingItem && editingItem.id === item.id && (
            <EditReadingModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={onRefresh} colors={colors} />
          )}
        </View>
      ))}
    </View>
  );
}

// Edit Reading Modal
function EditReadingModal({ item, onClose, onSaved, colors }: { item: ReadingItem; onClose: () => void; onSaved: () => void; colors: any }) {
  const [form, setForm] = useState(item);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    await readingItems.update(item.id, form);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  return (
    <BottomSheetModal visible onClose={onClose} title="Edit Reading">
      <FormField label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
      <FormField label="Author" value={form.author || ""} onChangeText={(v) => setForm({ ...form, author: v })} />
      <FormField label="Start Date" value={form.startDate || ""} onChangeText={(v) => setForm({ ...form, startDate: v })} />
      <FormField label="End Date" value={form.endDate || ""} onChangeText={(v) => setForm({ ...form, endDate: v })} />
      <FormField label="Notes" value={form.notes || ""} onChangeText={(v) => setForm({ ...form, notes: v })} multiline />

      <Pressable onPress={handleSave} style={({ pressed }) => ({ paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", marginTop: 16, opacity: pressed ? 0.8 : 1 })}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
      </Pressable>
    </BottomSheetModal>
  );
}

// Achievements List
function AchievementsList({ data, onRefresh, colors }: { data: Achievement[]; onRefresh: () => void; colors: any }) {
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);

  const handleDelete = (id: string, title: string) => {
    showAlert("Delete", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await achievements.delete(id); onRefresh(); } },
    ]);
  };

  if (data.length === 0) return <EmptyState title="No achievements yet" subtitle="Start winning!" icon="star.fill" />;

  return (
    <View>
      {data.map((item) => (
        <View key={item.id} style={{ backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, textTransform: "capitalize" }}>{item.type}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable onPress={() => setEditingItem(item)} style={{ padding: 4 }}>
                <IconSymbol name="pencil" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id, item.title)} style={{ padding: 4 }}>
                <IconSymbol name="trash" size={18} color={colors.error} />
              </Pressable>
            </View>
          </View>
          {item.date ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{item.date}</Text> : null}
          {item.place ? <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>Place: {item.place}</Text> : null}
          {item.prize ? <Text style={{ fontSize: 12, color: colors.success, marginTop: 2 }}>Prize: {item.prize}</Text> : null}
          {item.description ? <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 }}>{item.description}</Text> : null}
          {editingItem && editingItem.id === item.id && (
            <EditAchievementModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={onRefresh} colors={colors} />
          )}
        </View>
      ))}
    </View>
  );
}

// Edit Achievement Modal
function EditAchievementModal({ item, onClose, onSaved, colors }: { item: Achievement; onClose: () => void; onSaved: () => void; colors: any }) {
  const [form, setForm] = useState(item);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    await achievements.update(item.id, form);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  return (
    <BottomSheetModal visible onClose={onClose} title="Edit Achievement">
      <FormField label="Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
      <FormField label="Date" value={form.date || ""} onChangeText={(v) => setForm({ ...form, date: v })} />
      <FormField label="Place" value={form.place || ""} onChangeText={(v) => setForm({ ...form, place: v })} />
      <FormField label="Prize" value={form.prize || ""} onChangeText={(v) => setForm({ ...form, prize: v })} />
      <FormField label="Description" value={form.description || ""} onChangeText={(v) => setForm({ ...form, description: v })} multiline />

      <Pressable onPress={handleSave} style={({ pressed }) => ({ paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", marginTop: 16, opacity: pressed ? 0.8 : 1 })}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
      </Pressable>
    </BottomSheetModal>
  );
}


