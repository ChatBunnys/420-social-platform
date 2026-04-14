import { AgeVerificationGate } from "@/components/AgeVerificationGate";
import AdminPage from "@/pages/AdminPage";
import DonationPage from "@/pages/DonationPage";
import ExplorePage from "@/pages/ExplorePage";
import FeedPage from "@/pages/FeedPage";
import GroupDetailPage from "@/pages/GroupDetailPage";
import GroupsPage from "@/pages/GroupsPage";
import LoginPage from "@/pages/LoginPage";
import MessagesPage from "@/pages/MessagesPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import StoriesPage from "@/pages/StoriesPage";
import { useAgeVerificationStore } from "@/stores/ageVerification";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

function RootComponent() {
  const isVerified = useAgeVerificationStore((s) => s.isVerified);

  if (!isVerified) {
    return <AgeVerificationGate />;
  }

  return <Outlet />;
}

const rootRoute = createRootRoute({ component: RootComponent });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/feed" />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: FeedPage,
});

const storiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stories",
  component: StoriesPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: GroupsPage,
});

const groupDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups/$groupId",
  component: GroupDetailPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const messageDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages/$userId",
  component: MessagesPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$userId",
  component: ProfilePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const donationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/donate",
  component: DonationPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  feedRoute,
  storiesRoute,
  exploreRoute,
  groupsRoute,
  groupDetailRoute,
  messagesRoute,
  messageDetailRoute,
  profileRoute,
  settingsRoute,
  adminRoute,
  donationRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
