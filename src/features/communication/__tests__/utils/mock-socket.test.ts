import { describe, expect, it } from "vitest";
import { createMockSocket } from "./mock-socket";

describe("createMockSocket", () => {
  it("starts in connected state", () => {
    const socket = createMockSocket();
    expect(socket.connected).toBe(true);
  });

  it("registers and triggers listeners via simulateEvent", () => {
    const socket = createMockSocket();
    const received: unknown[] = [];

    socket.on("messageCreated", (payload) => received.push(payload));
    socket.simulateEvent("messageCreated", { id: "msg-1", body: "Hello" });

    expect(received).toEqual([{ id: "msg-1", body: "Hello" }]);
  });

  it("supports multiple listeners for the same event", () => {
    const socket = createMockSocket();
    const results: string[] = [];

    socket.on("typing", () => results.push("a"));
    socket.on("typing", () => results.push("b"));
    socket.simulateEvent("typing", {});

    expect(results).toEqual(["a", "b"]);
  });

  it("removes a specific listener with off", () => {
    const socket = createMockSocket();
    const results: string[] = [];
    const handler = () => results.push("called");

    socket.on("event", handler);
    socket.off("event", handler);
    socket.simulateEvent("event", {});

    expect(results).toEqual([]);
    expect(socket.getListeners("event").size).toBe(0);
  });

  it("records emitted events for assertions", () => {
    const socket = createMockSocket();

    socket.emit("joinConversation", "conv-1");
    socket.emit("typing", { conversationId: "conv-1", userId: "user-1" });

    expect(socket.getEmittedEvents()).toEqual([
      { event: "joinConversation", args: ["conv-1"] },
      { event: "typing", args: [{ conversationId: "conv-1", userId: "user-1" }] },
    ]);
  });

  it("filters emitted events by event name", () => {
    const socket = createMockSocket();

    socket.emit("joinConversation", "conv-1");
    socket.emit("typing", { userId: "u1" });
    socket.emit("joinConversation", "conv-2");

    expect(socket.getEmittedByEvent("joinConversation")).toEqual([
      { event: "joinConversation", args: ["conv-1"] },
      { event: "joinConversation", args: ["conv-2"] },
    ]);
  });

  it("simulateDisconnect sets connected=false and triggers disconnect listeners", () => {
    const socket = createMockSocket();
    let disconnected = false;

    socket.on("disconnect", () => { disconnected = true; });
    socket.simulateDisconnect();

    expect(socket.connected).toBe(false);
    expect(disconnected).toBe(true);
  });

  it("simulateReconnect sets connected=true and triggers connect listeners", () => {
    const socket = createMockSocket();
    let reconnected = false;

    socket.connected = false;
    socket.on("connect", () => { reconnected = true; });
    socket.simulateReconnect();

    expect(socket.connected).toBe(true);
    expect(reconnected).toBe(true);
  });

  it("clearEmitted removes all recorded emissions", () => {
    const socket = createMockSocket();

    socket.emit("event1", "data");
    socket.emit("event2", "data");
    socket.clearEmitted();

    expect(socket.getEmittedEvents()).toEqual([]);
  });

  it("reset clears listeners, emissions, and restores connected state", () => {
    const socket = createMockSocket();
    const results: string[] = [];

    socket.on("event", () => results.push("called"));
    socket.emit("event", "data");
    socket.connected = false;

    socket.reset();

    expect(socket.connected).toBe(true);
    expect(socket.getEmittedEvents()).toEqual([]);
    expect(socket.getListeners("event").size).toBe(0);

    socket.simulateEvent("event", {});
    expect(results).toEqual([]);
  });

  it("simulateEvent with no listeners does not throw", () => {
    const socket = createMockSocket();
    expect(() => socket.simulateEvent("nonexistent", {})).not.toThrow();
  });

  it("supports multiple args in simulateEvent", () => {
    const socket = createMockSocket();
    const received: unknown[][] = [];

    socket.on("multi", (...args) => received.push(args));
    socket.simulateEvent("multi", "arg1", "arg2", "arg3");

    expect(received).toEqual([["arg1", "arg2", "arg3"]]);
  });
});
