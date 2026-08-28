import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { projects as projectsStorage, accounts } from "@/lib/storage";
import type { Project, ProjectServiceAccount } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

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

export default function ProjectsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showServices, setShowServices] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<{ id: string; name: string; username: string; category: string }[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", category: "", status: "ongoing" as Project["status"],
    githubRepo: "", startDate: "", endDate: "", techStack: "", notes: "",
    serviceAccounts: [] as ProjectServiceAccount[],
  });

    const loadProjects = useCallback(async () => {
    const [data, accs] = await Promise.all([projectsStorage.getAll(), accounts.getAll()]);
    setProjects(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLinkedAccounts(accs.map((a) => ({ id: a.id, name: a.name, username: a.username, category: a.category })));
  }, []);

  useFocusEffect(
    useCallback(() => { loadProjects(); }, [loadProjects])
  );

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await projectsStorage.add({
      ...form,
      techStack: form.techStack ? form.techStack.split(",").map((s) => s.trim()) : [],
    });
    resetForm();
    setShowAdd(false);
    loadProjects();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Project", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await projectsStorage.delete(id); loadProjects(); } },
    ]);
  };

  const resetForm = () => {
    setForm({
      title: "", description: "", category: "", status: "ongoing",
      githubRepo: "", startDate: "", endDate: "", techStack: "", notes: "",
      serviceAccounts: [],
    });
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.key === status)?.color || colors.muted;
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.foreground }}>Projects</Text>
        <Pressable
          onPress={() => { resetForm(); setShowAdd(true); }}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16, alignItems: "center" }}>
        <Pressable onPress={() => setFilter("all")}
          style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: filter === "all" ? colors.primary : colors.surface, opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: filter === "all" ? "#FFF" : colors.muted }}>All ({projects.length})</Text>
        </Pressable>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setFilter(opt.key)}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: filter === opt.key ? opt.color : colors.surface, opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: filter === opt.key ? "#FFF" : colors.muted }}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Projects List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="folder_special" size={48} color={colors.border} />
            <Text style={{ fontSize: 15, color: colors.muted, marginTop: 12 }}>No projects yet</Text>
          </View>
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
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 20, padding: 24 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>New Project</Text>

              <TextInput placeholder="Project Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />
              <TextInput placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />
              <TextInput placeholder="Category (e.g., Web App, Mobile)" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />
              <TextInput placeholder="GitHub Repo URL" value={form.githubRepo} onChangeText={(v) => setForm({ ...form, githubRepo: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />
              <TextInput placeholder="Tech Stack (comma separated)" value={form.techStack} onChangeText={(v) => setForm({ ...form, techStack: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />
              <TextInput placeholder="Start Date (YYYY-MM-DD)" value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })}
                style={getInputStyle(colors)} placeholderTextColor={colors.muted} />

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

              {/* Service Accounts Section */}
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
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Project Detail / Service Mapping Modal */}
      <Modal visible={showServices && selectedProject !== null} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 20, padding: 24 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>{selectedProject?.title}</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>{selectedProject?.category}</Text>

              {selectedProject?.description ? (
                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>{selectedProject.description}</Text>
              ) : null}

              {selectedProject?.githubRepo ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconSymbol name="code" size={14} color={colors.muted} />
                  <Text style={{ fontSize: 13, color: colors.primary }}>{selectedProject.githubRepo}</Text>
                </View>
              ) : null}

              {selectedProject?.techStack && selectedProject.techStack.length > 0 ? (
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
                Service Accounts ({selectedProject?.serviceAccounts.length || 0})
              </Text>
              {selectedProject?.serviceAccounts && selectedProject.serviceAccounts.length > 0 ? (
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
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// Service Account Editor Component
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
      <Modal visible={showServicePicker} animationType="slide" transparent onRequestClose={() => setShowServicePicker(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: "70%" }}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Select Service</Text>
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
          </View>
        </View>
      </Modal>

      {/* Account Picker Modal */}
      <Modal visible={showAccountPicker} animationType="slide" transparent onRequestClose={() => setShowAccountPicker(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30, maxHeight: "70%" }}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>Link Account</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>Select an account for "{selectedService || customService}"</Text>
            <ScrollView style={{ maxHeight: 280 }}>
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
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable onPress={handleAddWithoutAccount} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>Skip (No Account)</Text>
              </Pressable>
              <Pressable onPress={() => { setShowAccountPicker(false); setSelectedService(""); setCustomService(""); }} style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
        Link a saved account or type manually. Linked accounts show a green indicator.
      </Text>
    </View>
  );
}

function getInputStyle(colors: any) {
  return {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.foreground, marginBottom: 10,
  };
}
