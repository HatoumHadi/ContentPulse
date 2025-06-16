// Platform configuration constants for better maintainability
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";
import { Globe, Heart, MessageCircle, Share, Eye, ThumbsUp, Repeat } from "lucide-react";

export const PLATFORM_ICONS = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  x: SiX,
  website: Globe,
} as const;

export const ENGAGEMENT_ICONS = {
  likes: Heart,
  comments: MessageCircle,
  shares: Share,
  views: Eye,
  thumbsUp: ThumbsUp,
  repeat: Repeat,
} as const;

export const PLATFORM_CONFIG = {
  x: {
    name: "X Posts",
    color: "bg-black text-white",
    engagementIcons: {
      likes: ENGAGEMENT_ICONS.likes,
      comments: ENGAGEMENT_ICONS.comments,
      shares: ENGAGEMENT_ICONS.repeat
    }
  },
  instagram: {
    name: "Instagram Posts",
    color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white",
    engagementIcons: {
      likes: ENGAGEMENT_ICONS.likes,
      comments: ENGAGEMENT_ICONS.comments,
      shares: ENGAGEMENT_ICONS.shares
    }
  },
  facebook: {
    name: "Facebook Posts",
    color: "bg-blue-600 text-white",
    engagementIcons: {
      likes: ENGAGEMENT_ICONS.thumbsUp,
      comments: ENGAGEMENT_ICONS.comments,
      shares: ENGAGEMENT_ICONS.shares
    }
  },
  website: {
    name: "Website Articles",
    color: "bg-green-600 text-white",
    engagementIcons: {
      views: ENGAGEMENT_ICONS.views,
      comments: ENGAGEMENT_ICONS.comments
    }
  },
} as const;

export const SUPPORTED_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
    description: 'Posts, Stories, and Reels'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-600',
    description: 'Posts and Pages'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    color: 'bg-black dark:bg-white dark:text-black',
    description: 'Tweets and Threads'
  },
  {
    id: 'website',
    name: 'Website',
    color: 'bg-green-600',
    description: 'Blog posts and Articles'
  },
] as const;

export type PlatformId = keyof typeof PLATFORM_CONFIG;
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];