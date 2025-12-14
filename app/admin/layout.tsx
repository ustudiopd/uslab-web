import AdminLayoutClient from '@/components/admin/AdminLayout';
import { getDictionary } from '@/lib/i18n/server';
import { defaultLocale } from '@/lib/i18n/config';

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // 어드민은 기본적으로 한국어 사용 (또는 브라우저 언어 감지)
  const dict = await getDictionary(defaultLocale);

  return (
    <AdminLayoutClient initialLang={defaultLocale} dict={dict}>
      {children}
    </AdminLayoutClient>
  );
}
