import { useReducer } from "react";
import { AppShell } from "./AppShell";
import { reflectionProvider } from "../services/mock-provider";
import { sessionReducer } from "../session/session-reducer";
import { initialSessionState } from "../session/session-types";
import { MAX_CORE_ROUNDS } from "../../shared/limits";
import type { RoundRequest } from "../../shared/ai-contract";

const MINIMUM_GENERATION_MS = 480;

export function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  const submitDilemma = async (dilemma: string) => {
    if (state.phase !== "entering") return;

    dispatch({ type: "SUBMIT_DILEMMA", dilemma });
    const request: RoundRequest = {
      contractVersion: "1" as const,
      kind: "round" as const,
      dilemma: dilemma.trim(),
      roundNumber: 1 as const,
      requestMode: "core" as const,
      maxCoreRounds: MAX_CORE_ROUNDS,
      history: [],
      focus: null,
    };

    const [round] = await Promise.all([
      reflectionProvider.getRound(request),
      new Promise((resolve) => window.setTimeout(resolve, MINIMUM_GENERATION_MS)),
    ]);

    dispatch({ type: "ROUND_LOADED", round });
  };

  return (
    <AppShell
      state={state}
      onOpenEntry={() => dispatch({ type: "OPEN_ENTRY" })}
      onCancelEntry={() => dispatch({ type: "CANCEL_ENTRY" })}
      onSubmitDilemma={submitDilemma}
    />
  );
}
