import type { SocialLinkDetails } from '@/lib/social-link-details';
import styles from './page.module.css';

export default function SocialLinkLabel({ link }: { link: SocialLinkDetails }) {
  const hasIcon = /^https:\/\/[^/]+\//.test(link.icon);
  return <span className={styles.socialLabel}>
    {/* Remote favicons have explicit dimensions and bypass the image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {hasIcon && <img src={link.icon} width={20} height={20} alt="" referrerPolicy="no-referrer" />}
    <span><strong>{link.label}</strong><small>{link.url}</small></span>
  </span>;
}
