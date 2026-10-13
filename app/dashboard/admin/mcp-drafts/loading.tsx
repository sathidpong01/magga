import { Box, Stack } from "@mui/material";
import { SkeletonLine } from "@/app/components/ui/PageSkeletons";
import styles from "./page.module.css";
export default function Loading() {
return <div className={styles.root} data-skeleton="mcp-drafts">
<header className={styles.header}><h1><SkeletonLine width={280} height={40} /></h1><SkeletonLine width={88} height={46} /></header>
<nav className={styles.tabs} aria-label="กำลังโหลดตัวกรองสถานะ">{[72,110,110,100,88].map((w,i)=><SkeletonLine key={i} width={w} height={40} />)}</nav>
<div className={styles.workspace}><aside className={styles.list}><h2><SkeletonLine width={180} height={26} /></h2><Stack spacing={1.3}>{[1,2,3].map(i=><Box key={i} className={styles.item}><Stack spacing={1}><SkeletonLine width={100} height={20} /><SkeletonLine height={24} /><SkeletonLine width="70%" height={20} /></Stack></Box>)}</Stack></aside><section className={styles.detail}><Stack spacing={2}><SkeletonLine width="70%" height={32} /><SkeletonLine width="45%" height={22} /><SkeletonLine height={100} /></Stack></section></div>
</div>;
}
