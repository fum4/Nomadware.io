import { CONTACT } from '../../constants';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export const isEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());

export interface ContactDraft {
  name: string;
  email: string;
  brief: string;
}

export const isComplete = ({ name, email, brief }: ContactDraft): boolean =>
  name.trim().length > 0 && isEmail(email) && brief.trim().length >= CONTACT.minBriefLength;
