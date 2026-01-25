import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-native/extend-expect";
import { vi } from "vitest";

// Use vi.hoisted() to ensure mocks are hoisted before any imports
const { mockLogger, mockEnv, mockTrpc, mockSupabase, mockBackendAuth } = vi.hoisted(() => {
  // Define React Native globals for test environment BEFORE any imports
  // Set __DEV__ directly without global declaration to avoid conflicts with Vitest's define
  (global as any).__DEV__ = true;
  (globalThis as any).__DEV__ = true;

  return {
    mockLogger: {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        sanitize: (data: any) => data,
      },
    },
    mockEnv: {
      env: {
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
        NODE_ENV: "test",
      },
      validateEnv: () => ({
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
        NODE_ENV: "test",
      }),
    },
    mockTrpc: {
      trpc: {
        useUtils: vi.fn(() => ({
          invalidate: vi.fn(),
          refetch: vi.fn(),
        })),
      },
      getBaseUrl: () => "http://localhost:8081",
    },
    mockSupabase: {
      supabase: {
        auth: {
          getSession: vi.fn(),
          getUser: vi.fn(),
        },
      },
    },
    mockBackendAuth: {
      supabaseAdmin: {
        from: vi.fn(),
      },
      assertServiceKeys: vi.fn(),
    },
  };
});

// Mock React Native modules
vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (obj: any) => obj.ios || obj.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
}));

// Mock Expo modules
vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => "/",
  Link: ({ children }: any) => children,
  Stack: {
    Screen: () => null,
  },
}));

vi.mock("@expo/vector-icons", () => ({
  MaterialIcons: () => null,
  FontAwesome: () => null,
  Ionicons: () => null,
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {},
  },
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock logger to avoid __DEV__ parsing issues - must be before any imports
vi.mock("@/lib/logger", () => mockLogger);

// Mock env to avoid logger import chain
vi.mock("@/lib/env", () => mockEnv);

// Mock trpc to avoid typeof window checks
vi.mock("@/lib/trpc", () => mockTrpc);

// Mock supabase to avoid typeof localStorage checks
vi.mock("@/lib/supabase", () => mockSupabase);

// Mock backend auth to avoid transitive imports
vi.mock("@/backend/lib/auth", () => mockBackendAuth);

process.env.EXPO_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-role-test-key";

