// @vitest-environment jsdom

import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/routes";

const { auth, verifiedUser, readTeamRole, hasAdminRole, teamPage, adminPage } = vi.hoisted(() => ({
  auth: { user: null as { id: string; email: string } | null, loading: false },
  verifiedUser: vi.fn(),
  readTeamRole: vi.fn(),
  hasAdminRole: vi.fn(),
  teamPage: vi.fn(() => "Team users page"),
  adminPage: vi.fn(() => "Admin documents page"),
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: verifiedUser },
    rpc: hasAdminRole,
    from: () => ({ select: () => ({ eq: () => ({ single: readTeamRole }) }) }),
  },
}));
vi.mock("@/components/AnalyticsTracker", () => ({ AnalyticsTracker: () => null }));
vi.mock("@/components/InteractiveDemo", () => ({ InteractiveDemo: () => "Public demo" }));
vi.mock("@/pages/p/[id]", () => ({ default: () => "Shared plan" }));
vi.mock("@/pages/auth/SignIn", () => ({ default: () => "Sign-in page" }));
vi.mock("@/pages/Dashboard", () => ({ default: () => "Dashboard page" }));
vi.mock("@/pages/DocumentExport", () => ({ default: adminPage }));
vi.mock("@/pages/team/TeamLogin", () => ({ default: () => "Team login page" }));
vi.mock("@/pages/team/TeamUsers", () => ({ default: teamPage }));
vi.mock("@/pages/team/TeamDashboard", () => ({ default: () => "Team dashboard page" }));
vi.mock("@/pages/team/TeamSettings", () => ({ default: () => "Team settings page" }));
vi.mock("@/pages/OAuthRedirect", () => ({ default: () => "Plaid callback" }));

const signedInUser = { id: "member-id", email: "member@example.com" };
let container: HTMLDivElement;
let root: Root;

function CurrentLocation() {
  const { pathname, search } = useLocation();
  return createElement("output", { id: "location" }, pathname + search);
}

async function renderPath(path: string) {
  await act(async () => {
    root.render(createElement(
      MemoryRouter,
      { initialEntries: [path], future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      createElement(CurrentLocation),
      createElement(AppRoutes),
    ));
  });
}

function currentLocation() {
  return container.querySelector("#location")?.textContent;
}

async function expectPage(text: string) {
  await vi.waitFor(async () => {
    await act(async () => vi.dynamicImportSettled());
    expect(container.textContent).toContain(text);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  auth.user = null;
  auth.loading = false;
  verifiedUser.mockImplementation(async () => ({ data: { user: auth.user }, error: null }));
  readTeamRole.mockResolvedValue({ data: null, error: null });
  hasAdminRole.mockResolvedValue({ data: false, error: null });
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

describe("route authorization", () => {
  it("waits for auth without mounting a private page", async () => {
    auth.loading = true;
    await renderPath("/admin/documents");
    expect(currentLocation()).toBe("/admin/documents");
    expect(container.textContent).toContain("Loading...");
    expect(adminPage).not.toHaveBeenCalled();
  });

  it.each([
    "/dashboard?panel=plan#payments", "/debts", "/settings", "/scenarios", "/plan",
    "/debt-plan", "/debt-chart", "/visualization", "/profile", "/financial-insights",
    "/ai-advisor", "/payoff-calendar", "/plan/share", "/plaid-submission", "/plaid-proposal",
    "/printable-summary", "/plaid-connect", "/share/history", "/debts-new", "/my-logs",
    "/admin", "/admin/roles", "/admin/documents", "/support-dashboard",
    "/security-audit", "/audit-dashboard",
  ])("sends signed-out visitors from %s to sign-in", async (path) => {
    await renderPath(path);
    await expectPage("Sign-in page");
    expect(currentLocation()).toBe(`/auth/signin?returnTo=${encodeURIComponent(path)}`);
    expect(adminPage).not.toHaveBeenCalled();
  });

  it.each([
    ["/demo/debts", "Public demo"],
    ["/p/sample", "Shared plan"],
    ["/oauth-redirect?oauth_state_id=sample", "Plaid callback"],
  ])("keeps %s public", async (path, page) => {
    await renderPath(path);
    await expectPage(page);
  });

  it("allows an ordinary signed-in user to reach their dashboard", async () => {
    auth.user = signedInUser;
    await renderPath("/dashboard");
    await expectPage("Dashboard page");
    expect(hasAdminRole).not.toHaveBeenCalled();
  });

  it("blocks admin exports for an ordinary user", async () => {
    auth.user = signedInUser;
    await renderPath("/admin/documents");
    await expectPage("Dashboard page");
    expect(adminPage).not.toHaveBeenCalled();
    expect(hasAdminRole).toHaveBeenCalledWith("has_role", { _user_id: signedInUser.id, _role: "admin" });
  });

  it("allows a verified application administrator to access exports", async () => {
    auth.user = signedInUser;
    hasAdminRole.mockResolvedValue({ data: true, error: null });
    await renderPath("/admin/documents");
    await expectPage("Admin documents page");
  });

  it("fails closed when the administrator role lookup errors", async () => {
    auth.user = signedInUser;
    hasAdminRole.mockResolvedValue({ data: null, error: new Error("Unavailable") });
    await renderPath("/admin/documents");
    await expectPage("Dashboard page");
    expect(adminPage).not.toHaveBeenCalled();
  });

  it.each([false, true])("blocks team pages without membership (signed in: %s)", async (signedIn) => {
    if (signedIn) auth.user = signedInUser;
    await renderPath("/team/users");
    await expectPage("Team login page");
    expect(teamPage).not.toHaveBeenCalled();
  });

  it("lets a verified support member access the team portal", async () => {
    auth.user = signedInUser;
    readTeamRole.mockResolvedValue({ data: { role: "support" }, error: null });
    await renderPath("/team/users");
    await expectPage("Team users page");
  });

  it("unmounts the team page when the session ends", async () => {
    auth.user = signedInUser;
    readTeamRole.mockResolvedValue({ data: { role: "readonly" }, error: null });
    await renderPath("/team/users");
    await expectPage("Team users page");

    auth.user = null;
    await renderPath("/team/users");
    await expectPage("Team login page");
    expect(container.textContent).not.toContain("Team users page");
  });

  it("limits team settings to a team administrator", async () => {
    auth.user = signedInUser;
    readTeamRole.mockResolvedValue({ data: { role: "support" }, error: null });
    await renderPath("/team/settings");
    await expectPage("Team dashboard page");
  });

  it("allows a team administrator to reach team settings", async () => {
    auth.user = signedInUser;
    readTeamRole.mockResolvedValue({ data: { role: "admin" }, error: null });
    await renderPath("/team/settings");
    await expectPage("Team settings page");
    expect(hasAdminRole).not.toHaveBeenCalled();
  });
});
