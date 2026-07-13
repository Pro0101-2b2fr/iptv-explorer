export interface Channel {
  id: string
  name: string
  alt_names: string[]
  network: string | null
  owners: string[]
  country: string
  categories: string[]
  is_nsfw: boolean
  launched: string | null
  closed: string | null
  replaced_by: string | null
  website: string | null
  logo: string | null
}

export interface Stream {
  channel: string | null
  feed: string | null
  title: string
  url: string
  quality: string | null
  label: string | null
  user_agent: string | null
  referrer: string | null
}

export interface Country {
  name: string
  code: string
  languages: string[]
  flag: string
}

export interface CountryWithCount extends Country {
  channel_count: number
}

export interface Category {
  id: string
  name: string
  description: string
}

export interface ChannelsResponse {
  channels: Channel[]
  total: number
  page: number
  limit: number
  total_pages: number
}
