import { vi } from "vite-plus/test";

vi.mock("astro:content", () => ({
  getCollection: vi.fn().mockResolvedValue([]),
}));
