import { useState, useCallback, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal, FlatList , Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams , useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { accounts, subscriptions, readingItems, achievements, projects as projectsStorage } from "@/lib/storage";
import type { Account, Subscription, ReadingItem, Achievement, Project, ProjectServiceAccount } from "@/lib/types";
import { CURRENCIES } from "@/lib/constants";

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";

type TabType = "projects" | "accounts" | "subscriptions" | "reading" | "achievements";

export default function TrackerScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || "projects");
  const [showAddProject, setShowAddProject] = useState(false);
  const [data, setData] = useState({
    projects: [] as Project[],
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
    const [projs, accs, subs, reads, achs] = await Promise.all([
      projectsStorage.getAll(),
      accounts.getAll(),
      subscriptions.getAll(),
      readingItems.getAll(),
      achievements.getAll(),
    ]);
    setData({ projects: projs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), accounts: accs, subscriptions: subs, reading: reads, achievements: achs });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "projects", label: "Projects", icon: "folder.fill" },
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
          onPress={() => {
            if (activeTab === "projects") setShowAddProject(true);
            else router.push(getAddRoute() as any);
          }}
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
        {activeTab === "projects" && <ProjectsList data={data.projects} accountsData={data.accounts} onRefresh={loadData} colors={colors} showAdd={showAddProject} setShowAdd={setShowAddProject} />}
        {activeTab === "accounts" && <AccountsList data={data.accounts} onRefresh={loadData} colors={colors} />}
        {activeTab === "subscriptions" && <SubscriptionsList data={data.subscriptions} onRefresh={loadData} colors={colors} />}
        {activeTab === "reading" && <ReadingList data={data.reading} onRefresh={loadData} colors={colors} />}
        {activeTab === "achievements" && <AchievementsList data={data.achievements} onRefresh={loadData} colors={colors} />}
      </ScrollView>
    </ScreenContainer>
  );
}

// =======================
// PROJECTS
// =======================
const STATUS_OPTIONS: { key: Project["status"]; label: string; color: string }[] = [
  { key: "ongoing", label: "Ongoing", color: "#5B8DEF" },
  { key: "completed", label: "Completed", color: "#34D399" },
  { key: "on_hold", label: "On Hold", color: "#FBBF24" },
  { key: "planned", label: "Planned", color: "#8B8FA3" },
];

const SERVICE_OPTIONS = [
  "Supabase", "Clerk", "Vercel", "AWS", "Google Cloud", "Azure",
  "Claude API", "Gemini API", "OpenAI API", "Firebase", "Other",
];

function ProjectsList({ data, accountsData, onRefresh, colors, showAdd, setShowAdd }: { data: Project[]; accountsData: Account[]; onRefresh: () => void; colors: any; showAdd: boolean; setShowAdd: (s: boolean) => void; }) {
  const [filter, setFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showServices, setShowServices] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "", status: "ongoing" as Project["status"],
    githubRepo: "", startDate: "", endDate: "", techStack: "", notes: "",
    serviceAccounts: [] as ProjectServiceAccount[],
  });

  const handleAdd = async () => {
    if (!form.title.trim()) {
      showAlert("Missing Title", "Please enter a project title before saving.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await projectsStorage.add({
      ...form,
      techStack: form.techStack ? form.techStack.split(",").map((s) => s.trim()) : [],
    });
    resetForm();
    setShowAdd(false);
    onRefresh();
  };

  const handleDelete = (id: string, title: string) => {
    showAlert("Delete Project", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await projectsStorage.delete(id); onRefresh(); } },
    ]);
  };

  const resetForm = () => {
    setForm({
      title: "", description: "", category: "", status: "ongoing",
      githubRepo: "", startDate: "", endDate: "", techStack: "", notes: "",
      serviceAccounts: [],
    });
  };

  const filtered = filter === "all" ? data : data.filter((p) => p.status === filter);

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.key === status)?.color || colors.muted;
  };

  const linkedAccounts = accountsData.map((a) => ({ id: a.id, name: a.name, username: a.username, category: a.category }));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16, alignItems: "center" }}>
        <Pressable onPress={() => setFilter("all")}
          style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: filter === "all" ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: filter === "all" ? "#FFF" : colors.muted }}>All ({data.length})</Text>
        </Pressable>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setFilter(opt.key)}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: filter === opt.key ? opt.color : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: filter === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState title="No projects yet" icon="folder.fill" />
      ) : (
        filtered.map((proj) => (
          <Pressable
            key={proj.id}
            onPress={() => { setSelectedProject(proj); setShowServices(true); }}
            style={({ pressed }) => ({
              backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10,
              borderWidth: 0.5, borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{proj.title}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <View style={{ padding: 3, borderRadius: 6, backgroundColor: getStatusColor(proj.status) + "20" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: getStatusColor(proj.status) }}>
                      {STATUS_OPTIONS.find((s) => s.key === proj.status)?.label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{proj.category}</Text>
                </View>
                {proj.description ? (
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 }} numberOfLines={2}>
                    {proj.description}
                  </Text>
                ) : null}
                {proj.serviceAccounts.length > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 }}>
                    <IconSymbol name="cloud.fill" size={12} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.primary }}>
                      {proj.serviceAccounts.length} service{proj.serviceAccounts.length !== 1 ? "s" : ""} linked
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() => handleDelete(proj.id, proj.title)}
                style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
              >
                <IconSymbol name="trash" size={18} color={colors.error} />
              </Pressable>
            </View>
            {proj.githubRepo ? (
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 8 }}>{proj.githubRepo}</Text>
            ) : null}
          </Pressable>
        ))
      )}

      {/* Add Project Modal */}
      <BottomSheetModal visible={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="New Project" scrollable maxHeight="90%">
        <FormField label="Project Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} required error={!form.title.trim() && form.title !== "" ? "Title is required" : undefined} />
        <FormField label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
        <FormField label="Category (e.g., Web App, Mobile)" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
        <FormField label="GitHub Repo URL" value={form.githubRepo} onChangeText={(v) => setForm({ ...form, githubRepo: v })} autoCapitalize="none" keyboardType="url" />
        <FormField label="Tech Stack (comma separated)" value={form.techStack} onChangeText={(v) => setForm({ ...form, techStack: v })} />
        <DatePickerField mode="date" label="Start Date" value={form.startDate} onDateChange={(d) => setForm({ ...form, startDate: d })} />

        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Status</Text>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((opt) => (
            <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
              style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                backgroundColor: form.status === opt.key ? opt.color : colors.surface, opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: form.status === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>Service Accounts</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10 }}>Track which account is used for each service</Text>
        <ServiceAccountEditor
          serviceAccounts={form.serviceAccounts}
          onChange={(sa) => setForm({ ...form, serviceAccounts: sa })}
          linkedAccounts={linkedAccounts}
          colors={colors}
        />

        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <Pressable onPress={() => { setShowAdd(false); resetForm(); }}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleAdd}
            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Save Project</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      {/* Project Detail / Service Mapping Modal */}
      <BottomSheetModal visible={showServices && selectedProject !== null} onClose={() => { setShowServices(false); setSelectedProject(null); }} scrollable maxHeight="90%">
        {selectedProject && (
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>{selectedProject.title}</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>{selectedProject.category}</Text>

            {selectedProject.description ? (
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>{selectedProject.description}</Text>
            ) : null}

            {selectedProject.githubRepo ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <IconSymbol name="code" size={14} color={colors.muted} />
                <Text style={{ fontSize: 13, color: colors.primary }}>{selectedProject.githubRepo}</Text>
              </View>
            ) : null}

            {selectedProject.techStack && selectedProject.techStack.length > 0 ? (
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {selectedProject.techStack.map((tech, i) => (
                  <View key={i} style={{ padding: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.surface }}>
                    <Text style={{ fontSize: 11, color: colors.primary }}>{tech}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Service Accounts */}
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginTop: 8, marginBottom: 10 }}>
              Service Accounts ({selectedProject.serviceAccounts.length || 0})
            </Text>
            {selectedProject.serviceAccounts && selectedProject.serviceAccounts.length > 0 ? (
              selectedProject.serviceAccounts.map((sa, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: colors.surface, borderRadius: 10, marginBottom: 6 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <IconSymbol name="cloud.fill" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{sa.service}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{sa.accountEmail}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>No service accounts linked</Text>
            )}

            <Pressable
              onPress={() => { setShowServices(false); setSelectedProject(null); }}
              style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Close</Text>
            </Pressable>
          </View>
        )}
      </BottomSheetModal>
    </View>
  );
}

function ServiceAccountEditor({
  serviceAccounts,
  onChange,
  linkedAccounts,
  colors,
}: {
  serviceAccounts: ProjectServiceAccount[];
  onChange: (accounts: ProjectServiceAccount[]) => void;
  linkedAccounts: { id: string; name: string; username: string; category: string }[];
  colors: any;
}) {
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [customService, setCustomService] = useState("");

  const handleRemove = (index: number) => {
    const updated = serviceAccounts.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handlePickAccount = (account: typeof linkedAccounts[0]) => {
    const serviceName = selectedService || customService.trim();
    if (!serviceName) return;
    onChange([...serviceAccounts, { service: serviceName, accountEmail: account.username, accountId: account.id }]);
    setSelectedService("");
    setCustomService("");
    setShowAccountPicker(false);
  };

  const handleAddWithoutAccount = () => {
    const serviceName = selectedService || customService.trim();
    if (!serviceName) return;
    onChange([...serviceAccounts, { service: serviceName, accountEmail: "" }]);
    setSelectedService("");
    setCustomService("");
    setShowServicePicker(false);
  };

  const handleServiceSelected = (service: string) => {
    setSelectedService(service);
    setShowServicePicker(false);
    setShowAccountPicker(true);
  };

  return (
    <View>
      {/* Existing service accounts */}
      {serviceAccounts.map((sa, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 8, backgroundColor: colors.surface, borderRadius: 8, marginBottom: 6 }}>
          <IconSymbol name="cloud.fill" size={14} color={colors.primary} />
          <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, marginLeft: 6 }}>{sa.service}</Text>
          {sa.accountId ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.primary }}>{sa.accountEmail}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: colors.muted }}>{sa.accountEmail || "No account"}</Text>
          )}
          <Pressable onPress={() => handleRemove(i)} style={{ marginLeft: 4, padding: 2 }}>
            <IconSymbol name="xmark" size={16} color={colors.error} />
          </Pressable>
        </View>
      ))}

      {/* Add Service Button */}
      <Pressable
        onPress={() => setShowServicePicker(true)}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.primary,
          borderStyle: "dashed", marginTop: 8, opacity: pressed ? 0.7 : 1,
        })}
      >
        <IconSymbol name="plus" size={16} color={colors.primary} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginLeft: 6 }}>Add Service</Text>
      </Pressable>

      {/* Service Picker Modal */}
      <BottomSheetModal visible={showServicePicker} onClose={() => setShowServicePicker(false)} title="Select Service" scrollable maxHeight="70%">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SERVICE_OPTIONS.map((service) => (
            <Pressable
              key={service}
              onPress={() => handleServiceSelected(service)}
              style={({ pressed }) => ({
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                backgroundColor: pressed ? colors.primary : colors.surface,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>{service}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Or type a custom service:</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            placeholder="Custom service name"
            value={customService}
            onChangeText={setCustomService}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.foreground }}
            placeholderTextColor={colors.muted}
          />
          <Pressable
            onPress={() => { if (customService.trim()) handleServiceSelected(customService.trim()); }}
            disabled={!customService.trim()}
            style={({ pressed }) => ({
              paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary,
              alignItems: "center", justifyContent: "center", opacity: pressed || !customService.trim() ? 0.5 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>Next</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => { setShowServicePicker(false); setCustomService(""); }} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>Cancel</Text>
        </Pressable>
      </BottomSheetModal>

      {/* Account Picker Modal */}
      <BottomSheetModal visible={showAccountPicker} onClose={() => setShowAccountPicker(false)} title="Link Account" scrollable maxHeight="70%">
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>Select an account for "{selectedService || customService}"</Text>
        {linkedAccounts.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", paddingVertical: 20 }}>
            No accounts saved. Add accounts first in the Tracker tab.
          </Text>
        ) : (
          linkedAccounts.map((acc) => (
            <Pressable
              key={acc.id}
              onPress={() => handlePickAccount(acc)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", padding: 12,
                backgroundColor: pressed ? colors.surface : colors.background,
                borderBottomWidth: 0.5, borderBottomColor: colors.border,
                marginBottom: 6, borderRadius: 10,
              })}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <IconSymbol name="person.fill" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{acc.name}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{acc.username}</Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.primary + "15" }}>{acc.category}</Text>
            </Pressable>
          ))
        )}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable onPress={handleAddWithoutAccount} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Skip (No Account)</Text>
          </Pressable>
          <Pressable onPress={() => { setShowAccountPicker(false); setSelectedService(""); setCustomService(""); }} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>Cancel</Text>
          </Pressable>
        </View>
      </BottomSheetModal>

      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
        Link a saved account or type manually. Linked accounts show a green indicator.
      </Text>
    </View>
  );
}

// =======================
// ACCOUNTS
// =======================
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


