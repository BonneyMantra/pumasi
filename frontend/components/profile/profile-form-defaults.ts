import { ProfileFormData } from '@/lib/types/profile';

// Demo prefilled data for easier testing
export const demoProfileDefaults: ProfileFormData = {
  displayName: 'Kim Minjun',
  bio: 'Full-stack developer with 5+ years of experience in blockchain and DeFi applications. Passionate about decentralized technologies and community-driven projects.',
  title: 'Senior Blockchain Developer',
  location: 'Seoul, South Korea',
  website: 'https://minjun.dev',
  skills: ['Solidity', 'React', 'TypeScript', 'Node.js', 'Web3'],
  languages: ['Korean', 'English', 'Japanese'],
  hourlyRate: 75,
  availability: 'available',
  socials: {
    twitter: '@minjun_dev',
    github: 'minjunkim',
    linkedin: 'https://linkedin.com/in/minjunkim',
    telegram: '@minjun_dev',
  },
};
