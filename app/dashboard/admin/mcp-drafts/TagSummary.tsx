import styles from './page.module.css';

function names(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => typeof item === 'string' ? [item] : item && typeof item === 'object' && 'name' in item && typeof item.name === 'string' ? [item.name] : []);
}
const key = (name: string) => name.trim().toLowerCase();

export function tagAction(current: Record<string, unknown>, proposal: Record<string, unknown>) {
  const requested = names(proposal.tag_names);
  const catalog = new Set(names(current.tag_catalog).map(key));
  return requested.some(name => !catalog.has(key(name))) ? 'สร้างและเพิ่มแท็ก' : 'เพิ่มแท็ก';
}

export default function TagSummary({ current, proposal }: { current: Record<string, unknown>; proposal: Record<string, unknown> }) {
  const requested = names(proposal.tag_names);
  const assigned = new Set(names(current.tag_names ?? current.tags).map(key));
  const catalog = new Set(names(current.tag_catalog).map(key));
  const rows = requested.map(name => ({ name, state: assigned.has(key(name)) ? 'มีอยู่ในเรื่องแล้ว' : catalog.has(key(name)) ? 'เพิ่มจากแท็กที่มี' : 'สร้างใหม่แล้วเพิ่ม' }));
  const changes = rows.filter(row => row.state !== 'มีอยู่ในเรื่องแล้ว').length;
  return <div className={styles.linkSummary}>
    <p>เพิ่มเข้ามังงะ <strong>{changes}</strong> แท็ก · เก็บแท็กเดิม {assigned.size}</p>
    <ul className={styles.linkRows}>{rows.map(row => <li key={key(row.name)}><span>{row.name}</span><small>{row.state}</small></li>)}</ul>
  </div>;
}
