import { useState, useCallback } from "react";
import { useFocusEffect , useRouter } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { notes as notesStorage } from "@/lib/storage";
import type { Note } from "@/lib/types";
import { useColors } from "@/hooks/use-colors";
import { showAlert } from "@/lib/alert";

export default function NotesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [notes, setNotes] = useState<Note[]>([]);

  const loadNotes = useCallback(async () => {
    const data = await notesStorage.getAll();
    setNotes(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);

  useFocusEffect(
    useCallback(() => { loadNotes(); }, [loadNotes])
  );

  const handleDelete = (id: string, title: string) => {
    showAlert("Delete Note", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await notesStorage.delete(id); loadNotes(); } },
    ]);
  };

  return (
    <ScreenContainer className="px-5">
      <ScreenHeader 
        title="Notes" 
        showBack 
        actionIcon="plus" 
        onActionPress={() => router.push("/(more)/note-editor" as any)} 
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {notes.length === 0 ? (
          <EmptyState icon="doc.fill" title="No notes yet" subtitle="Tap + to create a note" />
        ) : (
          notes.map((note) => (
            <Pressable
              key={note.id}
              onPress={() => router.push(`/(more)/note-editor?id=${note.id}` as any)}
              style={({ pressed }) => ({
                backgroundColor: colors.background, borderRadius: 14, padding: 14, marginBottom: 10,
                borderWidth: 0.5, borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{note.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{note.category}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 }} numberOfLines={3}>
                    {note.content}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
                    Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(note.id, note.title)}
                  style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
                >
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
