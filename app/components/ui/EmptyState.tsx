"use client";

import { Box, Typography, Button } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useRouter, useSearchParams } from "next/navigation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showClearFilters?: boolean;
}

export default function EmptyState({
  title = "ไม่พบผลลัพธ์",
  description = "ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น",
  showClearFilters = true,
}: EmptyStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const hasFilters = searchParams.get("search") || 
                     searchParams.get("categoryId") || 
                     searchParams.get("tags");

  const handleClearFilters = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        px: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          bgcolor: "rgba(255, 255, 255, 0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <SearchOffIcon
          sx={{
            fontSize: 60,
            color: "rgba(255, 255, 255, 0.2)",
          }}
        />
      </Box>

      <Typography
        variant="h5"
        fontWeight={600}
        sx={{
          background: "linear-gradient(135deg, #fbbf24 0%, #38bdf8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {description}
      </Typography>

      {showClearFilters && hasFilters && (
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          sx={{
            borderColor: "rgba(251, 191, 36, 0.5)",
            color: "#fbbf24",
            "&:hover": {
              borderColor: "#fbbf24",
              bgcolor: "rgba(251, 191, 36, 0.1)",
            },
          }}
        >
          ล้างตัวกรอง
        </Button>
      )}
    </Box>
  );
}
