// src/hooks/useRealtime.js
import { useEffect } from "react";

/**
 * Hook to initialise Supabase realtime subscriptions for core tables.
 * Updates the corresponding state setters with the new payloads.
 * Uses refs to always have the latest state arrays.
 */
export default function useRealtime({
  supabase,
  setCustomers,
  setAttendance,
  setMemberships,
  setNotifications,
  setAttendanceLocks,
  setVisitors,
  customersRef,
  attendanceRef,
  membershipsRef,
  notificationsRef,
  attendanceLocksRef,
  visitorsRef,
}) {
  useEffect(() => {
    if (!supabase) return;
    // Helper to merge incoming record into state array using ref for latest snapshot
    const upsert = (ref, setter, record, idKey = "id") => {
      const current = ref.current || [];
      const idx = current.findIndex((item) => item[idKey] === record[idKey]);
      const newArr = idx >= 0 ? [...current] : [...current, record];
      if (idx >= 0) newArr[idx] = record;
      setter(newArr);
    };

    const remove = (ref, setter, record, idKey = "id") => {
      const current = ref.current || [];
      const newArr = current.filter((item) => item[idKey] !== record[idKey]);
      setter(newArr);
    };

    // Create a single channel for all tables (named "dashboard-realtime")
    const channel = supabase.channel("dashboard-realtime");

    const tables = [
      { name: "clients", set: setCustomers, ref: customersRef },
      { name: "attendance", set: setAttendance, ref: attendanceRef },
      { name: "memberships", set: setMemberships, ref: membershipsRef },
      { name: "notification_logs", set: setNotifications, ref: notificationsRef },
      { name: "attendance_locks", set: setAttendanceLocks, ref: attendanceLocksRef, idKey: "date" },
      { name: "visitor_logs", set: setVisitors, ref: visitorsRef },
    ];

    tables.forEach(({ name, set, ref, idKey = "id" }) => {
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: name },
          (payload) => {
            const newRecord = payload.new;
            upsert(ref, set, newRecord, idKey);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: name },
          (payload) => {
            const updated = payload.new;
            upsert(ref, set, updated, idKey);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: name },
          (payload) => {
            const old = payload.old;
            remove(ref, set, old, idKey);
          }
        );
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Supabase realtime channel subscribed");
      }
    });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}
