// import { STORAGE_KEYS } from "@/constants/storage";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as ImagePicker from "expo-image-picker";
// import React, { useCallback, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Image,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// // ─── Types ────────────────────────────────────────────────────────────────────
// type ExplorePost = {
//   id: string;
//   imageUri: string;
//   description?: string;
//   authorName: string;
//   authorId: string;
//   createdAt: string;
// };

// const EXPLORE_POSTS_KEY = "explore_posts";

// function formatDate(iso: string): string {
//   const date = new Date(iso);
//   return date.toLocaleDateString("fr-FR", {
//     day: "numeric",
//     month: "long",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// // ─── Composant PostCard ───────────────────────────────────────────────────────
// function PostCard({
//   post,
//   currentAuthorName,
//   onDelete,
//   onEdit,
// }: {
//   post: ExplorePost;
//   currentAuthorName: string;
//   onDelete: (id: string) => void;
//   onEdit: (post: ExplorePost) => void;
// }) {
//   const isOwner = post.authorName === currentAuthorName;

//   const confirmDelete = () => {
//     Alert.alert(
//       "Supprimer le post",
//       "Es-tu sûr de vouloir supprimer ce post ? Cette action est irréversible.",
//       [
//         { text: "Annuler", style: "cancel" },
//         {
//           text: "Supprimer",
//           style: "destructive",
//           onPress: () => onDelete(post.id),
//         },
//       ]
//     );
//   };

//   return (
//     <View style={styles.card}>
//       <Image
//         source={{ uri: post.imageUri }}
//         style={styles.cardImage}
//         resizeMode="cover"
//       />
//       <View style={styles.cardBody}>
//         <View style={styles.cardHeader}>
//           <View style={styles.cardAvatar}>
//             <Ionicons name="person" size={14} color="#FF7A00" />
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.cardAuthor}>{post.authorName}</Text>
//             <Text style={styles.cardDate}>{formatDate(post.createdAt)}</Text>
//           </View>

//           {/* Actions propriétaire */}
//           {isOwner && (
//             <View style={styles.cardActions}>
//               <TouchableOpacity
//                 style={styles.cardActionButton}
//                 onPress={() => onEdit(post)}
//                 hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
//                 accessibilityLabel="Modifier le post"
//               >
//                 <Ionicons name="create-outline" size={17} color="#FF7A00" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.cardActionButton, styles.cardActionDelete]}
//                 onPress={confirmDelete}
//                 hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
//                 accessibilityLabel="Supprimer le post"
//               >
//                 <Ionicons name="trash-outline" size={17} color="#DC2626" />
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>

//         {post.description ? (
//           <Text style={styles.cardDescription}>{post.description}</Text>
//         ) : null}
//       </View>
//     </View>
//   );
// }

// // ─── Écran principal ──────────────────────────────────────────────────────────
// export default function ExploreScreen() {
//   const insets = useSafeAreaInsets();
//   const [posts, setPosts] = useState<ExplorePost[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentAuthorName, setCurrentAuthorName] = useState("");

//   // ── Modal création / édition ──
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingPost, setEditingPost] = useState<ExplorePost | null>(null);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [description, setDescription] = useState("");
//   const [publishing, setPublishing] = useState(false);

//   // ── Chargement ──────────────────────────────────────────────────────────────
//   const loadData = useCallback(async () => {
//     try {
//       const [postsRaw, accountRaw] = await Promise.all([
//         AsyncStorage.getItem(EXPLORE_POSTS_KEY),
//         AsyncStorage.getItem(STORAGE_KEYS.accountProfile),
//       ]);

//       const parsed: ExplorePost[] = postsRaw ? JSON.parse(postsRaw) : [];
//       setPosts(
//         parsed.sort(
//           (a, b) =>
//             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         )
//       );

//       const account = accountRaw ? JSON.parse(accountRaw) : null;
//       const name =
//         account?.nickname?.trim() ||
//         [account?.firstName?.trim(), account?.lastName?.trim()]
//           .filter(Boolean)
//           .join(" ") ||
//         "Utilisateur Ymeal";
//       setCurrentAuthorName(name);
//     } catch {
//       setPosts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   // ── Sauvegarde locale ───────────────────────────────────────────────────────
//   const savePosts = async (updated: ExplorePost[]) => {
//     await AsyncStorage.setItem(EXPLORE_POSTS_KEY, JSON.stringify(updated));
//     setPosts(
//       [...updated].sort(
//         (a, b) =>
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       )
//     );
//   };

//   // ── Suppression ─────────────────────────────────────────────────────────────
//   const handleDelete = async (id: string) => {
//     try {
//       const raw = await AsyncStorage.getItem(EXPLORE_POSTS_KEY);
//       const existing: ExplorePost[] = raw ? JSON.parse(raw) : [];
//       await savePosts(existing.filter((p) => p.id !== id));
//     } catch {
//       Alert.alert("Erreur", "Impossible de supprimer ce post.");
//     }
//   };

//   // ── Ouverture modal édition ─────────────────────────────────────────────────
//   const handleEdit = (post: ExplorePost) => {
//     setEditingPost(post);
//     setSelectedImage(post.imageUri);
//     setDescription(post.description ?? "");
//     setModalOpen(true);
//   };

//   // ── Fermeture modal ─────────────────────────────────────────────────────────
//   const closeModal = () => {
//     if (publishing) return;
//     setModalOpen(false);
//     setEditingPost(null);
//     setSelectedImage(null);
//     setDescription("");
//   };

//   // ── Sélection image ─────────────────────────────────────────────────────────
//   const pickFromGallery = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission refusée", "Autorise l'accès à la galerie.");
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 0.7,
//       allowsEditing: true,
//       aspect: [4, 3],
//     });
//     if (!result.canceled && result.assets[0]) {
//       setSelectedImage(result.assets[0].uri);
//     }
//   };

//   const pickFromCamera = async () => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission refusée", "Autorise l'accès à la caméra.");
//       return;
//     }
//     const result = await ImagePicker.launchCameraAsync({
//       quality: 0.7,
//       allowsEditing: true,
//       aspect: [4, 3],
//     });
//     if (!result.canceled && result.assets[0]) {
//       setSelectedImage(result.assets[0].uri);
//     }
//   };

//   // ── Publication / Mise à jour ───────────────────────────────────────────────
//   const publish = async () => {
//     if (!selectedImage || publishing) return;
//     setPublishing(true);

//     try {
//       const raw = await AsyncStorage.getItem(EXPLORE_POSTS_KEY);
//       const existing: ExplorePost[] = raw ? JSON.parse(raw) : [];

//       if (editingPost) {
//         // ── Mode édition : on remplace le post existant
//         const updated = existing.map((p) =>
//           p.id === editingPost.id
//             ? {
//                 ...p,
//                 imageUri: selectedImage,
//                 description: description.trim() || undefined,
//               }
//             : p
//         );
//         await savePosts(updated);
//       } else {
//         // ── Mode création : on ajoute un nouveau post
//         const newPost: ExplorePost = {
//           id: Date.now().toString(),
//           imageUri: selectedImage,
//           description: description.trim() || undefined,
//           authorName: currentAuthorName,
//           authorId: Date.now().toString(),
//           createdAt: new Date().toISOString(),
//         };
//         await savePosts([newPost, ...existing]);
//       }

//       closeModal();
//     } catch {
//       Alert.alert("Erreur", "Impossible de publier pour le moment.");
//     } finally {
//       setPublishing(false);
//     }
//   };

//   // ── Rendu ───────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#FF7A00" />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Explorer</Text>
//         <Text style={styles.headerSub}>
//           {posts.length === 0
//             ? "Sois le premier à partager un plat !"
//             : `${posts.length} plat${posts.length > 1 ? "s" : ""} partagé${posts.length > 1 ? "s" : ""}`}
//         </Text>
//       </View>

//       {/* Feed */}
//       {posts.length === 0 ? (
//         <View style={styles.emptyState}>
//           <View style={styles.emptyIcon}>
//             <Ionicons name="restaurant-outline" size={40} color="#FF7A00" />
//           </View>
//           <Text style={styles.emptyTitle}>Aucun plat partagé</Text>
//           <Text style={styles.emptySub}>
//             Appuie sur le bouton + pour partager ton premier plat !
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={posts}
//           keyExtractor={(item) => item.id}
//           renderItem={({ item }) => (
//             <PostCard
//               post={item}
//               currentAuthorName={currentAuthorName}
//               onDelete={handleDelete}
//               onEdit={handleEdit}
//             />
//           )}
//           contentContainerStyle={{
//             paddingHorizontal: 16,
//             paddingBottom: insets.bottom + 100,
//             gap: 16,
//             paddingTop: 8,
//           }}
//           showsVerticalScrollIndicator={false}
//         />
//       )}

//       {/* Bouton flottant */}
//       <TouchableOpacity
//         style={[styles.fab, { bottom: insets.bottom + 80 }]}
//         onPress={() => setModalOpen(true)}
//         activeOpacity={0.85}
//         accessibilityLabel="Partager un plat"
//       >
//         <Ionicons name="add" size={28} color="#FFF" />
//       </TouchableOpacity>

//       {/* Modal création / édition */}
//       <Modal
//         visible={modalOpen}
//         animationType="slide"
//         transparent
//         onRequestClose={closeModal}
//       >
//         <Pressable style={styles.modalBackdrop} onPress={closeModal}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === "ios" ? "padding" : undefined}
//             style={{ width: "100%" }}
//           >
//             <Pressable
//               style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
//               onPress={(e) => e.stopPropagation()}
//             >
//               {/* Titre */}
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>
//                   {editingPost ? "Modifier le post" : "Partager un plat"}
//                 </Text>
//                 <TouchableOpacity
//                   onPress={closeModal}
//                   hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                 >
//                   <Ionicons name="close" size={22} color="#475569" />
//                 </TouchableOpacity>
//               </View>

//               {/* Zone image */}
//               {selectedImage ? (
//                 <View style={styles.imagePreviewWrap}>
//                   <Image
//                     source={{ uri: selectedImage }}
//                     style={styles.imagePreview}
//                     resizeMode="cover"
//                   />
//                   {/* Changer l'image */}
//                   <View style={styles.imageOverlayActions}>
//                     <TouchableOpacity
//                       style={styles.imageOverlayButton}
//                       onPress={pickFromCamera}
//                     >
//                       <Ionicons name="camera-outline" size={16} color="#FFF" />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={styles.imageOverlayButton}
//                       onPress={pickFromGallery}
//                     >
//                       <Ionicons name="images-outline" size={16} color="#FFF" />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={[styles.imageOverlayButton, styles.imageOverlayDelete]}
//                       onPress={() => setSelectedImage(null)}
//                     >
//                       <Ionicons name="trash-outline" size={16} color="#FFF" />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ) : (
//                 <View style={styles.imagePicker}>
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={pickFromCamera}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons name="camera-outline" size={26} color="#FF7A00" />
//                     <Text style={styles.imagePickerLabel}>Caméra</Text>
//                   </TouchableOpacity>
//                   <View style={styles.imagePickerDivider} />
//                   <TouchableOpacity
//                     style={styles.imagePickerButton}
//                     onPress={pickFromGallery}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons name="images-outline" size={26} color="#FF7A00" />
//                     <Text style={styles.imagePickerLabel}>Galerie</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Description */}
//               <TextInput
//                 style={styles.descriptionInput}
//                 placeholder="Décris ton plat... (optionnel)"
//                 placeholderTextColor="#94A3B8"
//                 value={description}
//                 onChangeText={setDescription}
//                 multiline
//                 maxLength={300}
//               />

//               {/* Bouton publier / enregistrer */}
//               <TouchableOpacity
//                 style={[
//                   styles.publishButton,
//                   (!selectedImage || publishing) && styles.publishButtonDisabled,
//                 ]}
//                 onPress={publish}
//                 disabled={!selectedImage || publishing}
//                 activeOpacity={0.85}
//               >
//                 {publishing ? (
//                   <ActivityIndicator size="small" color="#FFF" />
//                 ) : (
//                   <>
//                     <Ionicons
//                       name={editingPost ? "checkmark-outline" : "paper-plane-outline"}
//                       size={18}
//                       color="#FFF"
//                     />
//                     <Text style={styles.publishButtonText}>
//                       {editingPost ? "Enregistrer" : "Publier"}
//                     </Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </Pressable>
//           </KeyboardAvoidingView>
//         </Pressable>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#FFF7EC" },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#FFF7EC",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingTop: 12,
//     paddingBottom: 16,
//   },
//   headerTitle: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
//   headerSub: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
//   emptyState: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 40,
//     gap: 12,
//   },
//   emptyIcon: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(255,122,0,0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", textAlign: "center" },
//   emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 },
//   card: {
//     backgroundColor: "#FFF",
//     borderRadius: 20,
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: "#F1E5D5",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOpacity: 0.06,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//       },
//       android: { elevation: 3 },
//     }),
//   },
//   cardImage: { width: "100%", height: 220 },
//   cardBody: { padding: 14, gap: 10 },
//   cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
//   cardAvatar: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "rgba(255,122,0,0.12)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   cardAuthor: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
//   cardDate: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
//   cardDescription: { fontSize: 14, color: "#334155", lineHeight: 20, fontWeight: "500" },
//   cardActions: { flexDirection: "row", gap: 8 },
//   cardActionButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "rgba(255,122,0,0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   cardActionDelete: { backgroundColor: "rgba(220,38,38,0.1)" },
//   fab: {
//     position: "absolute",
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#FF7A00",
//     justifyContent: "center",
//     alignItems: "center",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#FF7A00",
//         shadowOpacity: 0.4,
//         shadowRadius: 12,
//         shadowOffset: { width: 0, height: 6 },
//       },
//       android: { elevation: 8 },
//     }),
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: "rgba(15,23,42,0.45)",
//     justifyContent: "flex-end",
//   },
//   modalSheet: {
//     backgroundColor: "#FFF",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     gap: 14,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   modalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
//   imagePicker: {
//     flexDirection: "row",
//     borderWidth: 1,
//     borderColor: "#F1E5D5",
//     borderRadius: 16,
//     overflow: "hidden",
//     backgroundColor: "#FFFDF8",
//     height: 100,
//   },
//   imagePickerButton: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
//   imagePickerDivider: { width: 1, backgroundColor: "#F1E5D5" },
//   imagePickerLabel: { fontSize: 12, fontWeight: "700", color: "#FF7A00" },
//   imagePreviewWrap: { borderRadius: 16, overflow: "hidden", position: "relative" },
//   imagePreview: { width: "100%", height: 200 },
//   imageOverlayActions: {
//     position: "absolute",
//     bottom: 8,
//     right: 8,
//     flexDirection: "row",
//     gap: 6,
//   },
//   imageOverlayButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   imageOverlayDelete: { backgroundColor: "rgba(220,38,38,0.7)" },
//   descriptionInput: {
//     borderWidth: 1,
//     borderColor: "rgba(15,23,42,0.08)",
//     borderRadius: 14,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 14,
//     color: "#0F172A",
//     backgroundColor: "#FAFAFA",
//     minHeight: 80,
//     textAlignVertical: "top",
//   },
//   publishButton: {
//     backgroundColor: "#FF7A00",
//     borderRadius: 14,
//     height: 50,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//   },
//   publishButtonDisabled: { opacity: 0.45 },
//   publishButtonText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
// });