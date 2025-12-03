"use client";

import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import SecurityTab from "./SecurityTab";
import ProfileTab from "./ProfileTab";

interface Props {
  user: any;
  hasPassword: boolean;
}

export default function SettingsTabs({ user, hasPassword }: Props) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "rgba(255,255,255,0.1)", mb: 4 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": { color: "#a3a3a3", fontWeight: "bold" },
            "& .Mui-selected": { color: "#fbbf24 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#fbbf24" },
          }}
        >
          <Tab label="Profile" />
          <Tab label="Security & Login" />
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={tabIndex !== 0}>
        {tabIndex === 0 && <ProfileTab user={user} />}
      </Box>

      <Box role="tabpanel" hidden={tabIndex !== 1}>
        {tabIndex === 1 && <SecurityTab hasPassword={hasPassword} email={user?.email} />}
      </Box>
    </>
  );
}
