import React from "react";
import { Outlet } from "react-router-dom";
import { DemoPlanProvider } from "@/context/DemoPlanContext";

export default function DemoLayout() {
  return (
    <DemoPlanProvider>
      <Outlet />
    </DemoPlanProvider>
  );
}
