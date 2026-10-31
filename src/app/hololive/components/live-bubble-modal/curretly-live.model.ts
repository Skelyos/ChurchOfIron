export interface CurrentlyLiveStream {
  id: string | number;
  title: string;
  yt_video_key: string;
  channel: {
    photo: string;
    name: string;
  };
}

export interface CurrentlyLiveModel {
  cached: boolean;
  ended: CurrentlyLiveStream[];
  live: CurrentlyLiveStream[];
  upcoming: CurrentlyLiveStream[];
}
