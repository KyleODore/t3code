/** Which thread-row edge holds Settle and Snooze; `trailing` keeps both on the right-to-left swipe. */
export type ThreadSwipeLayout = "trailing" | "settle-trailing" | "snooze-trailing";

export const DEFAULT_THREAD_SWIPE_LAYOUT: ThreadSwipeLayout = "settle-trailing";
