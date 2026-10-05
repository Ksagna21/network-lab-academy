import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import CiscoLabPlayer from "./CiscoLabPlayer";

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn() }) }));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const renderLab = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/cisco-labs/${id}`]}>
      <Routes>
        <Route path="/cisco-labs/:labId" element={<CiscoLabPlayer />} />
      </Routes>
    </MemoryRouter>,
  );

const type = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
};

describe("lecteur de lab Cisco", () => {
  it("met à jour les objectifs quand on tape des commandes", () => {
    renderLab("cisco-interface-basics");
    expect(screen.getByText("0 / 5")).toBeTruthy();
    const input = () => screen.getByRole("textbox");

    type(input(), "enable");
    type(input(), "configure terminal");
    type(input(), "hostname R1");
    expect(screen.getByText("1 / 5")).toBeTruthy();
    // le prompt reflète le nouveau nom
    expect(screen.getByText("R1(config)#")).toBeTruthy();
  });

  it("affiche l'aide contextuelle avec « ? » et les erreurs IOS", () => {
    renderLab("cisco-interface-basics");
    const input = screen.getByRole("textbox");
    type(input, "enable");
    fireEvent.change(input, { target: { value: "show " } });
    fireEvent.keyDown(input, { key: "?" });
    expect(screen.getAllByText(/running-config/).length).toBeGreaterThan(0);
    type(input, "foo");
    expect(screen.getByText(/Invalid input detected/)).toBeTruthy();
  });

  it("affiche une page 404 pour un lab inconnu", () => {
    renderLab("inconnu");
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
