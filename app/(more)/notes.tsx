import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { notes as notesStorage } from "@/lib/storage";
import type { Note } from "@/lib/types";

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "" });

  const loadNotes = useCallback(async () => {
    const data = await notesStorage.getAll();
    setNotes(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadNotes(); }, [loadNotes])
  );

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await notesStorage.add({ title: form.title, content: form.content, category: form.category || "general" });
    setForm({ title: "", content: "", category: "" });
    setShowAdd(false);
    loadNotes();
  };

  const handleUpdate = async () => {
    if (!editNote || !form.title.trim()) return;
    await notesStorage.update(editNote.id, { title: form.title, content: form.content, category: form.category });
    setEditNote(null);
    setForm({ title: "", content: "", category: "" });
    loadNotes();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Note", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await notesStorage.delete(id); loadNotes(); } },
    ]);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setForm({ title: note.title, content: note.content, category: note.category });
  };

  return (
    <ScreenContainer className="px-5">
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 12, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginLeft: 12 }}>Notes</Text>
        </View>
        <Pressable
          onPress={() => { setShowAdd(true); setForm({ title: "", content: "", category: "" }); }}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 18, backgroundColor: "#5B8DEF",
            alignItems: "center", justifyContent: "center", opacity: pressed ? 0.8 : 1,
          })}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {notes.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <IconSymbol name="doc.fill" size={48} color="#E8EAED" />
            <Text style={{ fontSize: 15, color: "#8B8FA3", marginTop: 12 }}>No notes yet</Text>
          </View>
        ) : (
          notes.map((note) => (
            <Pressable
              key={note.id}
              onPress={() => openEdit(note)}
              style={({ pressed }) => ({
                backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 0.5, borderColor: "#E8EAED",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1A2E" }}>{note.title}</Text>
                  <Text style={{ fontSize: 12, color: "#8B8FA3", marginTop: 2 }}>{note.category}</Text>
                  <Text style={{ fontSize: 13, color: "#8B8FA3", marginTop: 6, lineHeight: 18 }} numberOfLines={3}>
                    {note.content}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#E8EAED", marginTop: 8 }}>
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(note.id, note.title)}
                  style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
                >
                  <IconSymbol name="trash" size={18} color="#F87171" />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAdd || editNote !== null} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, backgroundColor: "#E8EAED", borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 }}>
              {editNote ? "Edit Note" : "New Note"}
            </Text>
            <TextInput
              placeholder="Title"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }}
              placeholderTextColor="#8B8FA3"
            />
            <TextInput
              placeholder="Category"
              value={form.category}
              onChangeText={(v) => setForm({ ...form, category: v })}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", marginBottom: 10 }}
              placeholderTextColor="#8B8FA3"
            />
            <TextInput
              placeholder="Content"
              value={form.content}
              onChangeText={(v) => setForm({ ...form, content: v })}
              multiline numberOfLines={6}
              style={{ backgroundColor: "#F7F8FA", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", minHeight: 140, textAlignVertical: "top", marginBottom: 16 }}
              placeholderTextColor="#8B8FA3"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => { setShowAdd(false); setEditNote(null); setForm({ title: "", content: "", category: "" }); }}
                style={{ flex: 1, backgroundColor: "#F7F8FA", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#8B8FA3" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={editNote ? handleUpdate : handleAdd}
                style={{ flex: 1, backgroundColor: "#5B8DEF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>{editNote ? "Update" : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
