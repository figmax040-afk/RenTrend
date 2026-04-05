import { supabase } from './supabase';

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });
  } catch (err) {
    console.error('Email send failed (non-critical):', err);
    // Never throw — email failure must not break the main flow
  }
}
