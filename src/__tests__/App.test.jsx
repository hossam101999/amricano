import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("adds a person and supports undo/redo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Main Scoreboard");

    await user.click(screen.getByTitle("Add Person"));
    await user.type(screen.getByLabelText("Name"), "Alice");
    await user.type(screen.getByLabelText("Points"), "10");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Alice")).toBeInTheDocument();

    const undo = screen.getByTitle("Undo");
    expect(undo).toBeEnabled();
    await user.click(undo);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    const redo = screen.getByTitle("Redo");
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("resets undo history when switching boards", async () => {
    const user = userEvent.setup();
    const boards = [
      {
        id: 1,
        name: "Board A",
        people: [],
        created: "2024-01-01T00:00:00.000Z",
      },
      {
        id: 2,
        name: "Board B",
        people: [],
        created: "2024-01-01T00:00:00.000Z",
      },
    ];
    localStorage.setItem("scoreboard-boards", JSON.stringify(boards));

    render(<App />);

    await screen.findByText("Board A");

    await user.click(screen.getByTitle("Add Person"));
    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.type(screen.getByLabelText("Points"), "5");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Sam")).toBeInTheDocument();
    expect(screen.getByTitle("Undo")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Switch Board/i }));
    await user.click(screen.getByRole("button", { name: /Board B/i }));

    await screen.findByText("Board B");
    expect(screen.getByTitle("Undo")).toBeDisabled();
  });
});
