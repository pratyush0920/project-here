export default function PrivacyPage() {
  return (
    <article className="space-y-4 pb-8">
      <h1 className="text-xl font-medium">Privacy</h1>
      <p className="text-muted">
        Your updates are visible only to you and the person in your active space.
      </p>
      <p className="text-muted">
        Photos and voice drops live in private storage. They are not public pages.
      </p>
      <p className="text-muted">
        Here does not track your location, show when you were last here, or mark things as
        seen unless you tap Seen yourself.
      </p>
      <p className="text-muted">
        Disconnecting the space hides each other&apos;s private updates. Your own content
        remains yours.
      </p>
    </article>
  );
}
