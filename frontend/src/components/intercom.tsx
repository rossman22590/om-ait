"use client";

import { useEffect } from "react";
import Intercom from "@intercom/messenger-js-sdk";

export function IntercomLoader() {
  useEffect(() => {
    try {
      Intercom({ app_id: "cqwzmjsm" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Intercom init failed", e);
    }
  }, []);

  return null;
}
