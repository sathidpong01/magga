import { DashboardPageHeader, DashboardStat } from "@/app/components/dashboard/system";
import { Box, Grid, Skeleton, Stack } from "@mui/material";
import { DashboardSurface, dashboardInsetSurfaceSx } from "@/app/components/dashboard/system";

export default function AdminDashboardLoading() {
  return (
    <Box data-skeleton="admin-overview">
      <DashboardPageHeader
        eyebrow="ADMIN WORKSPACE"
        title="ภาพรวมการดูแลระบบ"
        description="สรุปภาพรวมของมังงะ ผู้ใช้ คอมเมนต์ และรายการฝากลง เพื่อให้ตัดสินใจและจัดการงานประจำวันได้จากหน้าเดียว"
        sx={{ mb: 2 }}
      />
      <Grid data-skeleton-kpis container spacing={1.5} columns={{xs:12,sm:12,md:12,lg:7}} sx={{mb:2.5}}>
        {["มังงะทั้งหมด","ฉบับร่าง","รายการรอตรวจ","ผู้ใช้ทั้งหมด","คอมเมนต์","หมวดหมู่","แท็ก"].map((label,i)=><Grid key={label} size={{xs:i===6?12:6,sm:i>=4?4:3,md:i>=4?4:3,lg:1}}><DashboardStat label={label} value={<Skeleton width={45} height="1.1em" />} icon={<Skeleton variant="rectangular" width={18} height={18} />} compact /></Grid>)}
      </Grid>
      {/* Popular Manga: Side-by-side Top 3 (Left 7) & Top 4-10 (Right 5) */}
      <Grid container spacing={2} sx={{ alignItems: "flex-start" }}>
        {/* Left: Top 3 Manga Skeleton */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton
                variant="text"
                width={190}
                height={26}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5, borderRadius: "6px" }}
              />
              <Skeleton
                variant="text"
                width={130}
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
              />
            </Box>

            <Grid container spacing={1.5} sx={{ alignItems: "flex-start" }}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} size={{ xs: 12, sm: 4 }}>
                  <Box
                    sx={{
                      ...dashboardInsetSurfaceSx,
                      p: 1.25,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "10px",
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      sx={{
                        aspectRatio: "3 / 4",
                        height: "auto",
                        borderRadius: "8px",
                        bgcolor: "rgba(255,255,255,0.06)",
                        mb: 1,
                      }}
                    />
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={20}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={65}
                      height={18}
                      sx={{ bgcolor: "rgba(255,255,255,0.07)", mt: 0.5, borderRadius: "4px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={85}
                      height={14}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", mt: 0.25, borderRadius: "4px" }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </DashboardSurface>
        </Grid>

        {/* Right: Top 4-10 Manga Skeleton */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <DashboardSurface sx={{ p: { xs: 2, md: 2.25 }, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton
                variant="text"
                width={110}
                height={26}
                sx={{ bgcolor: "rgba(255,255,255,0.08)", mb: 0.5, borderRadius: "6px" }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={16}
                sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flex: 1, justifyContent: "space-between" }}>
              {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
                <Box
                  key={rank}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.25,
                    px: 1.25,
                    py: 0.65,
                    borderRadius: "8px",
                    ...dashboardInsetSurfaceSx,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
                    <Skeleton
                      variant="text"
                      width={18}
                      height={16}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "3px" }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={32}
                      height={42}
                      sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: "4px", flexShrink: 0 }}
                    />
                    <Skeleton
                      variant="text"
                      width="55%"
                      height={18}
                      sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "4px" }}
                    />
                  </Box>
                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Skeleton
                      variant="text"
                      width={40}
                      height={16}
                      sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: "3px" }}
                    />
                    <Skeleton
                      variant="text"
                      width={50}
                      height={12}
                      sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "3px" }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </DashboardSurface>
        </Grid>
      </Grid>
    </Box>
  );
}
