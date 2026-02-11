import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { isAuthenticated } from "./src/lib/auth";

export default function App() {
  const [logado, setLogado] = useState(null);

  useEffect(() => {
    isAuthenticated().then(setLogado);
  }, []);

  if (logado === null) {
    return (
      <View style={styles.centralizar}>
        <ActivityIndicator size="large" color="#BCEB3C" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={logado ? "dark" : "light"} />
      {logado ? (
        <HomeScreen onLogout={() => setLogado(false)} />
      ) : (
        <LoginScreen onLoginSuccess={() => setLogado(true)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centralizar: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
});
