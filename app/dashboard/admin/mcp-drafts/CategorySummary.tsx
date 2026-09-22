import styles from './page.module.css';

function category(value: unknown) {
  return value && typeof value === 'object' && 'name' in value && typeof value.name === 'string' ? value.name : null;
}

export function categoryAction(current: Record<string, unknown>) {
  return current.category_catalog ? 'ใช้หมวดหมู่ที่มี' : 'สร้างและใช้หมวดหมู่';
}

export default function CategorySummary({ current, proposal }: { current: Record<string, unknown>; proposal: Record<string, unknown> }) {
  const currentName = category(current.category) ?? 'ยังไม่มีหมวดหมู่';
  const proposedName = typeof proposal.category_name === 'string' ? proposal.category_name : 'ข้อมูลไม่ถูกต้อง';
  const same = currentName.trim().toLowerCase() === proposedName.trim().toLowerCase();
  const outcome = same ? 'ใช้อยู่แล้ว' : current.category_catalog ? 'ใช้หมวดหมู่ที่มี' : 'สร้างหมวดหมู่ใหม่';
  return <div className={styles.linkSummary}>
    <p><span className={styles.muted}>{currentName} → </span><strong>{proposedName}</strong></p>
    <p className={styles.muted}>{outcome}{same ? ' · ไม่มีการเปลี่ยนแปลง' : ' · จะแทนหมวดหมู่ปัจจุบัน'}</p>
  </div>;
}
