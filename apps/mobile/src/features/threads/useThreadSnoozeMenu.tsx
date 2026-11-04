import { useAtomValue } from "@effect/atom-react";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/shell";
import {
  canSnooze,
  effectiveSnoozed,
  type SnoozePreset,
} from "@t3tools/client-runtime/state/thread-settled";
import type { SnoozePresetSetting } from "@t3tools/contracts/settings";
import { useState } from "react";

import * as Dialog from "../../components/ui/Dialog";
import { useNowAfter, useNowMinuteMs } from "../../lib/clock";
import { threadListEnvironmentsAtom } from "../../state/presentation";
import { useThreadListActions } from "../home/useThreadListActions";
import { CustomSnoozeSheet } from "./CustomSnoozeSheet";
import {
  resolveThreadListV2SnoozeGateExpiryMs,
  resolveThreadListV2SnoozeMenuSelection,
  resolveThreadSnoozeMenuItem,
} from "./threadListV2";

/** Re-reads the preset at selection: the menu may have been built minutes earlier. */
function presetWakeTime(
  preset: SnoozePreset,
  presets: ReadonlyArray<SnoozePresetSetting> | undefined,
): string | null {
  const selection = resolveThreadListV2SnoozeMenuSelection({
    event: `snooze:${preset.id}`,
    displayedPresets: [preset],
    now: new Date(),
    presets,
  });
  return selection._tag === "selected" ? selection.preset.snoozedUntil : null;
}

/** The open thread's Snooze or Wake now menu entry, plus the custom snooze sheet it opens. */
export function useThreadSnoozeMenu(thread: EnvironmentThreadShell | null, canOperate: boolean) {
  const { snoozeEnvironmentIds, snoozePresetsByEnvironmentId } = useAtomValue(
    threadListEnvironmentsAtom,
  );
  const { snoozeThread, unsnoozeThread } = useThreadListActions();
  const [customSnoozeOpen, setCustomSnoozeOpen] = useState(false);
  const gateExpiryMs =
    thread === null
      ? null
      : resolveThreadListV2SnoozeGateExpiryMs(thread, { now: thread.latestUserMessageAt ?? "" });
  const wakeAtMs = thread?.snoozedUntil == null ? NaN : Date.parse(thread.snoozedUntil);
  // The minute keeps preset labels current; the deadlines flip the gate and the snooze on time.
  const minuteMs = useNowMinuteMs();
  const gateNowMs = useNowAfter(gateExpiryMs === null ? null : gateExpiryMs + 1);
  const wakeNowMs = useNowAfter(Number.isNaN(wakeAtMs) ? null : wakeAtMs);
  const now = new Date(Math.max(minuteMs, gateNowMs, wakeNowMs)).toISOString();
  if (thread === null) return { item: null, customSnoozeSheet: null };

  const presets = snoozePresetsByEnvironmentId.get(thread.environmentId);
  const item = resolveThreadSnoozeMenuItem({
    supported: snoozeEnvironmentIds.has(thread.environmentId),
    canOperate,
    snoozed: effectiveSnoozed(thread, { now }),
    snoozable: canSnooze(thread, { now }),
    now,
    presets,
    onSnooze: (preset) => {
      const snoozedUntil = presetWakeTime(preset, presets);
      if (snoozedUntil === null) {
        Dialog.alert(
          "Could not snooze thread",
          "That snooze time has passed. Choose another time.",
        );
      } else {
        void snoozeThread(thread, snoozedUntil);
      }
    },
    onCustom: () => setCustomSnoozeOpen(true),
    onWake: () => void unsnoozeThread(thread),
  });
  return {
    item,
    customSnoozeSheet: customSnoozeOpen ? (
      <CustomSnoozeSheet
        onClose={() => setCustomSnoozeOpen(false)}
        onSnooze={(snoozedUntil) => void snoozeThread(thread, snoozedUntil)}
      />
    ) : null,
  };
}
