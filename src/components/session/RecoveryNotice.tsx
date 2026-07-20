export function RecoveryNotice({ message }: { message: string }) {
  return (
    <div className="recovery-notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}
