import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import { logout } from "../lib/auth";

function srcFotoPerfil(fotoPerfil) {
  if (!fotoPerfil || typeof fotoPerfil !== "string") return null;
  const s = fotoPerfil.trim();
  if (!s) return null;
  if (s.startsWith("data:")) return s;
  return `data:image/jpeg;base64,${s}`;
}

export default function AppHeader({ title, onLogout }) {
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoErro, setFotoErro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((res) => {
      const foto = res.data?.foto_perfil;
      if (foto) setFotoPerfil(foto);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setFotoErro(false);
  }, [fotoPerfil]);

  const fotoSrc = srcFotoPerfil(fotoPerfil);
  const mostrarFoto = fotoSrc && !fotoErro;

  const handleSair = async () => {
    setMenuAberto(false);
    await logout();
    onLogout?.();
  };

  return (
    <View style={styles.header}>
      <View style={styles.tituloWrap}>
        <Text style={styles.titulo}>{title}</Text>
      </View>
      <TouchableOpacity
        onPress={() => setMenuAberto(true)}
        style={styles.botaoPerfil}
        activeOpacity={0.8}
      >
        {mostrarFoto ? (
          <Image
            source={{ uri: fotoSrc }}
            style={styles.foto}
            onError={() => setFotoErro(true)}
          />
        ) : (
          <Ionicons name="person-outline" size={24} color="#374151" />
        )}
      </TouchableOpacity>

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuAberto(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSair}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="#374151" />
              <Text style={styles.menuItemTexto}>Sair</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#F7F9F3",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tituloWrap: {
    flex: 1,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  botaoPerfil: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  foto: {
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemTexto: {
    fontSize: 15,
    color: "#374151",
  },
});
