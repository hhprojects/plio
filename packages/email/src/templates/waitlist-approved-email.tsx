import { Button, Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './layout';

interface WaitlistApprovedEmailProps {
  businessName: string;
  contactName: string;
  loginUrl: string;
}

export function WaitlistApprovedEmail({
  businessName,
  contactName,
  loginUrl,
}: WaitlistApprovedEmailProps) {
  return (
    <EmailLayout preview={`Your Plio account for ${businessName} is ready!`}>
      <Heading style={heading}>Welcome to Plio!</Heading>
      <Text style={paragraph}>Hi {contactName},</Text>
      <Text style={paragraph}>
        Great news! Your application for <strong>{businessName}</strong> has been
        approved. Your Plio account is ready to use.
      </Text>
      <Text style={paragraph}>
        Click the button below to set your password and start managing your
        business.
      </Text>
      <Button style={button} href={loginUrl}>
        Set Your Password
      </Button>
      <Text style={smallText}>
        If you did not submit this application, please contact us immediately.
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
