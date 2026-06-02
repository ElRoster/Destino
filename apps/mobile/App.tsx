import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Sparkles, Wallet, LogOut, Video, Compass, User, Key, Mail } from 'lucide-react-native';

const Stack = createNativeStackNavigator();

// --- Authentication Screen ---
function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Home');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.authWrapper}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Sparkles color="#f59e0b" size={32} />
          </View>
          <Text style={styles.logoText}>TAROT MOBILE</Text>
          <Text style={styles.subtitleText}>Conexión Mística en tu Bolsillo</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@tarot.com"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Home / Dashboard Screen ---
function HomeScreen({ navigation }: any) {
  const [balance, setBalance] = useState(100.0);

  const mockReaders = [
    { id: '1', name: 'Madame Sophia', bio: 'Experta en Tarot de Marsella y Astrología', rate: 5.5 },
    { id: '2', name: 'Profesor Marcus', bio: 'Tarot Egipcio y Lectura del Aura', rate: 4.0 }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Profile */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerWelcome}>Hola,</Text>
            <Text style={styles.headerUser}>client@tarot.com</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <LogOut color="#f43f5e" size={24} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Wallet color="#f59e0b" size={20} />
            <Text style={styles.balanceTitle}>Saldo de Tokens</Text>
          </View>
          <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
          <TouchableOpacity style={styles.rechargeBtn} onPress={() => setBalance(prev => prev + 50)}>
            <Text style={styles.rechargeText}>RECARGAR +$50.00</Text>
          </TouchableOpacity>
        </View>

        {/* Tarot Readers List */}
        <Text style={styles.sectionTitle}>Tarotistas Disponibles</Text>
        {mockReaders.map(reader => (
          <View key={reader.id} style={styles.readerCard}>
            <View style={styles.readerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{reader.name[0]}</Text>
              </View>
              <View style={styles.readerDetails}>
                <Text style={styles.readerName}>{reader.name}</Text>
                <Text style={styles.readerBio}>{reader.bio}</Text>
              </View>
            </View>
            <View style={styles.readerFooter}>
              <Text style={styles.readerRate}>${reader.rate.toFixed(2)} tokens/min</Text>
              <TouchableOpacity 
                style={styles.callBtn}
                onPress={() => navigation.navigate('Call', { reader })}
              >
                <Video color="#fff" size={16} />
                <Text style={styles.callBtnText}>Llamar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Live Call Screen ---
function CallScreen({ route, navigation }: any) {
  const { reader } = route.params;

  return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
      <View style={styles.callContainer}>
        <Text style={styles.callHeader}>Lectura en Curso</Text>
        <Text style={styles.callTarget}>{reader.name}</Text>
        <Text style={styles.callTimer}>Conectando a transmisión WebRTC...</Text>

        <View style={styles.videoStreamContainer}>
          <View style={styles.videoStreamPlaceholder}>
            <Text style={styles.videoStreamText}>Transmisión del Tarotista</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.hangupBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.hangupText}>FINALIZAR LLAMADA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Root Application Stack ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0c0517' }
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0517',
  },
  scrollContent: {
    padding: 20,
  },
  authWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '300',
  },
  formContainer: {
    backgroundColor: '#160b29',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    padding: 20,
  },
  label: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0c0517',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  headerWelcome: {
    color: '#9ca3af',
    fontSize: 14,
  },
  headerUser: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: '#160b29',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceTitle: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    marginLeft: 6,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
    fontFamily: 'Courier',
    marginBottom: 16,
  },
  rechargeBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  rechargeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  readerCard: {
    backgroundColor: '#160b29',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    padding: 16,
    marginBottom: 16,
  },
  readerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  readerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  readerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  readerBio: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  readerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: 12,
  },
  readerRate: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 'bold',
  },
  callBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  callContainer: {
    alignItems: 'center',
    padding: 24,
  },
  callHeader: {
    color: '#9ca3af',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  callTarget: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  callTimer: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 8,
  },
  videoStreamContainer: {
    width: '100%',
    aspectRatio: 4/3,
    backgroundColor: '#160b29',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginVertical: 24,
    overflow: 'hidden',
  },
  videoStreamPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStreamText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  hangupBtn: {
    backgroundColor: '#f43f5e',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  hangupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
