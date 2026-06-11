import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = { info: '⚽', success: '✅', error: '❌', warning: '⚠️' };
  const colors = {
    info: 'var(--cyan)',
    success: 'var(--green-neon)',
    error: 'var(--red)',
    warning: 'var(--gold)',
  };

  return (
    <div
      className="toast"
      style={{ borderColor: colors[toast.type] || colors.info, color: colors[toast.type] || colors.info }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icons[toast.type] || icons.info}</span>
      <span style={{ color: 'var(--white)', fontWeight: 500 }}>{toast.msg}</span>
    </div>
  );
}
