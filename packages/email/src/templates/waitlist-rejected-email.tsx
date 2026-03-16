import { Heading, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './layout';

interface WaitlistRejectedEmailProps {
  businessName: string;
  contactName: string;
}

export function WaitlistRejectedEmail({
  businessName,
  contactName,
}: WaitlistRejectedEmailProps) {
  return (
    <EmailLayout preview={`Update on your Plio application for ${businessName}`}>
      <Heading style={heading}>Application Update</Heading>
      <Text style={paragraph}>Hi {contactName},</Text>
      <Text style={paragraph}>
        Thank you for your interest in Plio for <strong>{businessName}</strong>.
        After reviewing your application, we&apos;re unable to onboard your
        business at this time.
      </Text>
      <Text style={paragraph}>
        This may be due to limited capacity during our early access period. We
        encourage you to apply again in the future as we expand availability.
      </Text>
      <Text style={paragraph}>
        If you have questions, feel free to reach out to our support team.
      </Text>
      <Text style={smallText}>
        Thank you for your understanding.
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

const smallText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#8898aa',
  margin: '16px 0 0',
};
