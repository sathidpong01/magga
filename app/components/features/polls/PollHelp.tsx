"use client";
import { IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { maggaColors } from "@/lib/design-tokens";
export default function PollHelp({ text }: { text: string }) {
  return (
    <Tooltip
      title={text}
      describeChild
      enterTouchDelay={0}
      leaveTouchDelay={3000}
    >
      <IconButton
        type="button"
        aria-label="ข้อมูลเพิ่มเติม"
        size="small"
        sx={{ color: maggaColors.textSecondary, width: 32, height: 32 }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}
