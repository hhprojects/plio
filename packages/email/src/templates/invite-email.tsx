import { Button, Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './layout';

interface InviteEmailProps {
  inviteeName: string;
  inviterName: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
}

export function InviteEmail({
  inviteeName,
  inviterName,
  tenantName,
  role,
  inviteUrl,
}: InviteEmailProps) {
  const roleLabel = role === 'admin' ? 'an administrator' : `a ${role}`;

  return (
    <EmailLayout preview={`You've been invited to join ${tenantName} on Plio`}>
      <Heading style={heading}>You&apos;re invited!</Heading>
      <Text style={paragraph}>Hi {inviteeName},</Text>
      <Text style={paragraph}>
        {inviterName} has invited you to join <strong>{tenantName}</strong> on
        Plio as {roleLabel}. Click the button below to set up your account.
      </Text>
      <Button style={button} href={inviteUrl}>
        Accept Invitation
      </Button>
      <Text style={smallText}>
        This invitation expires in 7 days. If you did not expect this email, you
        can safely ignore it.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0f172a',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#334155',
  margin: '0 0 12px',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
};

const smallText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#8898aa',
  margin: '16px 0 0',
};
