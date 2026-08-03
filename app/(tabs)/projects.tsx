import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { projects as projectsStorage, accounts, readingItems } from "@/lib/storage";
import type { Project, ProjectServiceAccount } from "@/lib/types";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showServices, setShowServices] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "", status: "ongoing" as Project["status"],
    githubRepo: "", startDate: "", endDate: "", techStack: "", notes: "",
    serviceAccounts: [] as ProjectServiceAccount[],
  });

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const data = await projectsStorage.getAll();
    setProjects(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  };

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
    return STATUS_OPTIONS.find((s) => s.key === status)?.color || "#8B8FA3";
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#1A1A2E" }}>Projects</Text>
        <Pressable
          onPress={() => { resetForm(); setShowAdd(true); }}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
        <Pressable onPress={() => setFilter("all")}
          style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: filter === "all" ? "#5B8DEF" : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: filter === "all" ? "#FFF" : "#8B8FA3" }}>All ({projects.length})</Text>
        </Pressable>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable key={opt.key} onPress={() => setFilter(opt.key)}
            style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: filter === opt.key ? opt.color : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: filter === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Projects List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="folder_special" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No projects yet</Text>
          </View>
        ) : (
          filtered.map((proj) => (
            <Pressable
              key={proj.id}
              onPress={() => { setSelectedProject(proj); setShowServices(true); }}
              style={({ pressed }) => ({
                backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 0.5, borderColor: "#E8EAED",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#1A1A2E" }}>{proj.title}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <View style={{ padding: 3, borderRadius: 6, backgroundColor: getStatusColor(proj.status) + "20" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: getStatusColor(proj.status) }}>
                        {STATUS_OPTIONS.find((s) => s.key === proj.status)?.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#8B8FA3" }}>{proj.category}</Text>
                  </View>
                  {proj.description ? (
                    <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 6, lineHeight: 16 }} numberOfLines={2}>
                      {proj.description}
                    </Text>
                  ) : null}
                  {proj.serviceAccounts.length > 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 }}>
                      <IconSymbol name="cloud.fill" size={12} color="#5B8DEF" />
                      <Text style={{ fontSize: 11, color: "#5B8DEF" }}>
                        {proj.serviceAccounts.length} service{proj.serviceAccounts.length !== 1 ? "s" : ""} linked
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => handleDelete(proj.id, proj.title)}
                  style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
                >
                  <IconSymbol name="trash" size={18} color="#F87171" />
                </Pressable>
              </View>
              {proj.githubRepo ? (
                <Text style={{ fontSize: 12, color: "#5B8DEF", marginTop: 8 }}>{proj.githubRepo}</Text>
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>New Project</Text>

              <TextInput placeholder="Project Title" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
              <TextInput placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
              <TextInput placeholder="Category (e.g., Web App, Mobile)" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
              <TextInput placeholder="GitHub Repo URL" value={form.githubRepo} onChangeText={(v) => setForm({ ...form, githubRepo: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
              <TextInput placeholder="Tech Stack (comma separated)" value={form.techStack} onChangeText={(v) => setForm({ ...form, techStack: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />
              <TextInput placeholder="Start Date (YYYY-MM-DD)" value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })}
                style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }} placeholderTextColor="#8B8FA3" />

              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 8 }}>Status</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable key={opt.key} onPress={() => setForm({ ...form, status: opt.key })}
                    style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: form.status === opt.key ? opt.color : "#F7F8FA", opacity: pressed ? 0.85 : 1 })}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: form.status === opt.key ? "#FFF" : "#8B8FA3" }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Service Accounts Section */}
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 8 }}>Service Accounts</Text>
              <Text style={{ fontSize: 12, color: "#8B8FA3", marginBottom: 10 }}>Track which account is used for each service</Text>
              <ServiceAccountEditor
                serviceAccounts={form.serviceAccounts}
                onChange={(sa) => setForm({ ...form, serviceAccounts: sa })}
              />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                <Pressable onPress={() => { setShowAdd(false); resetForm(); }}
                  style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleAdd}
                  style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
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
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24 }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 }}>{selectedProject?.title}</Text>
              <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 16 }}>{selectedProject?.category}</Text>

              {selectedProject?.description ? (
                <Text style={{ fontSize: 13, color: "#8B8FA3", lineHeight: 18, marginBottom: 12 }}>{selectedProject.description}</Text>
              ) : null}

              {selectedProject?.githubRepo ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconSymbol name="code" size={14} color="#8B8FA3" />
                  <Text style={{ fontSize: 13, color: "#5B8DEF" }}>{selectedProject.githubRepo}</Text>
                </View>
              ) : null}

              {selectedProject?.techStack && selectedProject.techStack.length > 0 ? (
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {selectedProject.techStack.map((tech, i) => (
                    <View key={i} style={{ padding: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "#F7F8FA" }}>
                      <Text style={{ fontSize: 11, color: "#5B8DEF" }}>{tech}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Service Accounts */}
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E", marginTop: 8, marginBottom: 10 }}>
                Service Accounts ({selectedProject?.serviceAccounts.length || 0})
              </Text>
              {selectedProject?.serviceAccounts && selectedProject.serviceAccounts.length > 0 ? (
                selectedProject.serviceAccounts.map((sa, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#F7F8FA", borderRadius: 10, marginBottom: 6 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#5B8DEF20", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                      <IconSymbol name="cloud.fill" size={16} color="#5B8DEF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1A1A2E" }}>{sa.service}</Text>
                      <Text style={{ fontSize: 12, color: "#8B8FA3" }}>{sa.accountEmail}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 13, color: "#8B8FA3", marginBottom: 12 }}>No service accounts linked</Text>
              )}

              <Pressable
                onPress={() => { setShowServices(false); setSelectedProject(null); }}
                style={{ marginTop: 16, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
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
}: {
  serviceAccounts: ProjectServiceAccount[];
  onChange: (accounts: ProjectServiceAccount[]) => void;
}) {
  const [newService, setNewService] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleAdd = () => {
    if (!newService.trim() || !newEmail.trim()) return;
    onChange([...serviceAccounts, { service: newService.trim(), accountEmail: newEmail.trim() }]);
    setNewService("");
    setNewEmail("");
  };

  const handleRemove = (index: number) => {
    const updated = serviceAccounts.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <View>
      {serviceAccounts.map((sa, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 8, backgroundColor: "#F7F8FA", borderRadius: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 13, color: "#1A1A2E", flex: 1 }}>{sa.service}</Text>
          <Text style={{ fontSize: 12, color: "#5B8DEF", marginRight: 8 }}>{sa.accountEmail}</Text>
          <Pressable onPress={() => handleRemove(i)}>
            <IconSymbol name="xmark" size={16} color="#F87171" />
          </Pressable>
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <TextInput
          placeholder="Service name"
          value={newService}
          onChangeText={setNewService}
          style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: "#1A1A2E" }}
          placeholderTextColor="#8B8FA3"
        />
        <TextInput
          placeholder="Account email"
          value={newEmail}
          onChangeText={setNewEmail}
          onSubmitEditing={handleAdd}
          style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: "#1A1A2E" }}
          placeholderTextColor="#8B8FA3"
        />
        <Pressable onPress={handleAdd} style={({ pressed }) => ({
          width: 36, height: 36, borderRadius: 8, backgroundColor: "#5B8DEF",
          alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
        })}>
          <IconSymbol name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={{ fontSize: 11, color: "#8B8FA3", marginTop: 6 }}>
        Add which Google/GitHub account you use for each service in this project
      </Text>
    </View>
  );
}
