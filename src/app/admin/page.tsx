import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// /admin is intentionally decommissioned & obscured for security.
// The secure admin portal is located at /hq-master-88
export default function AdminDecommissionedPage() {
  notFound();
}
