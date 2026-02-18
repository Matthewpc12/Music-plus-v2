import { Album, Playlist, Song } from './types';

export const MOCK_ALBUMS: Album[] = [
  {
    id: '1',
    title: 'SOS',
    artist: 'SZA',
    cover: 'https://picsum.photos/id/10/400/400',
    year: '2022'
  },
  {
    id: '2',
    title: 'Midnights',
    artist: 'Taylor Swift',
    cover: 'https://picsum.photos/id/11/400/400',
    year: '2022'
  },
  {
    id: '3',
    title: 'Heroes & Villains',
    artist: 'Metro Boomin',
    cover: 'https://picsum.photos/id/12/400/400',
    year: '2022'
  },
  {
    id: '4',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    cover: 'https://picsum.photos/id/13/400/400',
    year: '2022'
  },
  {
    id: '5',
    title: 'Renaissance',
    artist: 'Beyoncé',
    cover: 'https://picsum.photos/id/14/400/400',
    year: '2022'
  },
  {
    id: '6',
    title: 'Harry\'s House',
    artist: 'Harry Styles',
    cover: 'https://picsum.photos/id/15/400/400',
    year: '2022'
  }
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    title: 'Today\'s Hits',
    description: 'The biggest songs right now.',
    cover: 'https://picsum.photos/id/20/400/400'
  },
  {
    id: 'p2',
    title: 'A-List Pop',
    description: 'The best new pop music.',
    cover: 'https://picsum.photos/id/21/400/400'
  },
  {
    id: 'p3',
    title: 'Rap Life',
    description: 'Hip-hop culture.',
    cover: 'https://picsum.photos/id/22/400/400'
  },
  {
    id: 'p4',
    title: 'Dale Reggaetón',
    description: 'Latin hits.',
    cover: 'https://picsum.photos/id/23/400/400'
  }
];

// Using public domain MP3s for the demo to ensure playback works
const DEMO_MP3_1 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const DEMO_MP3_2 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
const DEMO_MP3_3 = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";

export const MOCK_SONGS: Song[] = [
  {
    id: 's1',
    filename: 's1.mp3',
    title: 'Kill Bill',
    artist: 'SZA',
    album: 'SOS',
    cover: 'https://picsum.photos/id/10/400/400',
    duration: '2:33',
    durationSec: 153,
    fileUrl: DEMO_MP3_1,
    lyrics: [
      { time: 10, text: "I'm still a fan even though I was salty" },
      { time: 15, text: "Hate to see you with some other broad, know you happy" },
      { time: 20, text: "Hate to see you happy if I'm not the one driving" },
      { time: 25, text: "I'm so mature, I'm so mature" },
      { time: 30, text: "I'm so mature, I got me a therapist to tell me there's other men" }
    ]
  },
  {
    id: 's2',
    filename: 's2.mp3',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    cover: 'https://picsum.photos/id/11/400/400',
    duration: '3:20',
    durationSec: 200,
    fileUrl: DEMO_MP3_2,
    lyrics: [
      { time: 5, text: "I have this thing where I get older but just never wiser" },
      { time: 10, text: "Midnights become my afternoons" },
      { time: 15, text: "When my depression works the graveyard shift" }
    ]
  },
  {
    id: 's3',
    filename: 's3.mp3',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: 'Harry\'s House',
    cover: 'https://picsum.photos/id/15/400/400',
    duration: '2:47',
    durationSec: 167,
    fileUrl: DEMO_MP3_3,
    lyrics: [
        { time: 2, text: "Holdin' me back" },
        { time: 5, text: "Gravity's holdin' me back" },
        { time: 8, text: "I want you to hold out the palm of your hand" }
    ]
  }
];