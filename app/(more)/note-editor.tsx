import { useState, useEffect, useRef } from "react";
import { View, TextInput, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/ui/screen-header";
import { notes as notesStorage } from "@/lib/storage";
import { useColors } from "@/hooks/use-colors";
import type { Note } from "@/lib/types";

export default function NoteEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Keep track of the current note ID (either from params, or generated after first save)
  const currentNoteId = useRef<string | null>(id || null);
  const isDirty = useRef(false);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    async function loadNote() {
      if (id) {
        const data = await notesStorage.getAll();
        const existingNote = data.find((n) => n.id === id);
        if (existingNote) {
          setTitle(existingNote.title);
          setContent(existingNote.content);
          setCategory(existingNote.category);
          setLastSaved(new Date(existingNote.updatedAt));
        }
      }
      setIsLoaded(true);
    }
    loadNote();
  }, [id]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isLoaded) return;
    
    // Mark as dirty when user types
    isDirty.current = true;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, category, isLoaded]);

  const saveNote = async () => {
    // Discard empty notes
    if (!title.trim() && !content.trim()) return;
    if (!isDirty.current) return;

    setIsSaving(true);
    try {
      if (currentNoteId.current) {
        await notesStorage.update(currentNoteId.current, { title, content, category });
      } else {
        const newNote = await notesStorage.add({ title: title || "Untitled", content, category });
        currentNoteId.current = newNote.id; // Store the new ID so subsequent auto-saves update it
      }
      
      setLastSaved(new Date());
      isDirty.current = false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    // Explicit save trigger
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    if (!title.trim() && !content.trim() && !currentNoteId.current) {
      // Discard empty new note completely
      router.back();
      return;
    }

    if (isDirty.current) {
      await saveNote();
    }
    router.back();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <ScreenContainer>
      <ScreenHeader 
        title={""} // Title is in the body for notes
        showBack 
        actionLabel="Done" 
        onActionPress={handleDone} 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 100, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Metadata Row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <View style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <TextInput 
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
                placeholderTextColor={colors.muted}
                style={{ fontSize: 13, color: colors.primary, fontWeight: "600", padding: 0 }}
              />
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {isSaving ? (
                <Text style={{ fontSize: 12, color: colors.muted }}>Saving...</Text>
              ) : lastSaved ? (
                <Text style={{ fontSize: 12, color: colors.muted }}>Saved ✓</Text>
              ) : null}
              <Text style={{ fontSize: 12, color: colors.muted }}>• {wordCount} words</Text>
            </View>
          </View>

          {/* Title Input */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 16,
              padding: 0,
            }}
          />

          {/* Content Input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Start writing..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={{
              flex: 1,
              fontSize: 16,
              lineHeight: 24,
              color: colors.foreground,
              padding: 0,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
